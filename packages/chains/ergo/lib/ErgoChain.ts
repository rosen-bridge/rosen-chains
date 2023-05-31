import AbstractErgoNetwork from './network/AbstractErgoNetwork';
import {
  AbstractUtxoChain,
  AssetBalance,
  BoxInfo,
  ConfirmationStatus,
  EventTrigger,
  FailedError,
  NetworkError,
  NotFoundError,
  PaymentOrder,
  PaymentTransaction,
  TransactionAssetBalance,
  UnexpectedApiError,
  ChainUtils,
  SinglePayment,
  ImpossibleBehavior,
  TransactionTypes,
  NotEnoughValidBoxesError,
  NotEnoughAssetsError,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import * as wasm from 'ergo-lib-wasm-nodejs';
import Serializer from './Serializer';
import { blake2b } from 'blakejs';
import { ERGO_CHAIN } from './constants';
import { ErgoConfigs } from './types';
import { AbstractLogger } from '@rosen-bridge/logger-interface';
import ErgoTransaction from './ErgoTransaction';
import ErgoUtils from './ErgoUtils';

class ErgoChain extends AbstractUtxoChain<wasm.ErgoBox> {
  static feeBoxErgoTree =
    '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304';
  declare network: AbstractErgoNetwork;
  declare configs: ErgoConfigs;
  feeRatioDivisor: bigint;
  protected signFunction: (
    tx: wasm.ReducedTransaction,
    requiredSign: number,
    boxes: Array<wasm.ErgoBox>,
    dataBoxes?: Array<wasm.ErgoBox>
  ) => Promise<wasm.Transaction>;

  constructor(
    network: AbstractErgoNetwork,
    configs: ErgoConfigs,
    feeRatioDivisor: bigint,
    signFunction: (
      tx: wasm.ReducedTransaction,
      requiredSign: number,
      boxes: Array<wasm.ErgoBox>,
      dataBoxes?: Array<wasm.ErgoBox>
    ) => Promise<wasm.Transaction>,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
    this.feeRatioDivisor = feeRatioDivisor;
    this.signFunction = signFunction;
  }

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param unsignedTransactions ongoing unsigned PaymentTransactions (used for preventing double spend)
   * @param serializedSignedTransactions the serialized string of ongoing signed transactions (used for chainning transaction)
   * @param inputs the inputs for transaction
   * @param dataInputs the data inputs for transaction
   * @returns the generated payment transaction
   */
  generateTransaction = async (
    eventId: string,
    txType: string,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[],
    inputs: Array<string>,
    dataInputs: Array<string>
  ): Promise<PaymentTransaction> => {
    // calculate required assets
    const orderRequiredAssets = order
      .map((order) => order.assets)
      .reduce(ChainUtils.sumAssetBalance, { nativeToken: 0n, tokens: [] });
    const inputAssets = inputs
      .map(
        (serializedBox) =>
          this.getBoxInfo(
            wasm.ErgoBox.sigma_parse_bytes(Buffer.from(serializedBox, 'hex'))
          ).assets
      )
      .reduce(ChainUtils.sumAssetBalance, { nativeToken: 0n, tokens: [] });
    const requiredAssets = ChainUtils.subtractAssetBalance(
      orderRequiredAssets,
      inputAssets,
      0n,
      true
    );

    // check if there are enough assets in address
    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededErgs = requiredAssets.nativeToken.toString();
      const neededTokens = ErgoUtils.JsonBI.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. Erg: ${neededErgs}, Tokens: ${neededTokens}`
      );
    }

    // extract input boxIds from unsigned transactions to prevent double spend
    const forbiddenBoxIds = unsignedTransactions.flatMap((paymentTx) => {
      const tx = Serializer.deserialize(paymentTx.txBytes).unsigned_tx();
      const ids: string[] = [];
      for (let i = 0; i < tx.inputs().len(); i++)
        ids.push(tx.inputs().get(i).box_id().to_str());
      return ids;
    });

    // generate box tracking map from mempool and signed transactions
    const trackMap = this.getTransactionsBoxMapping(
      serializedSignedTransactions.map((serializedTx) =>
        Serializer.signedDeserialize(Buffer.from(serializedTx, 'hex'))
      ),
      this.configs.lockAddress
    );
    (await this.getMempoolBoxMapping(this.configs.lockAddress)).forEach(
      (value, key) => trackMap.set(key, value)
    );

    // call getCovering to get enough boxes
    const coveredBoxes = await this.getCoveringBoxes(
      this.configs.lockAddress,
      requiredAssets,
      forbiddenBoxIds,
      trackMap
    );

    // check if boxes covered requirements
    if (!coveredBoxes.covered) {
      const neededErgs = requiredAssets.nativeToken.toString();
      const neededTokens = ErgoUtils.JsonBI.stringify(requiredAssets.tokens);
      throw new NotEnoughValidBoxesError(
        `Available boxes didn't cover required assets. Erg: ${neededErgs}, Tokens: ${neededTokens}`
      );
    }

    // add boxes to input list
    inputs.push(
      ...coveredBoxes.boxes.map((box) =>
        Buffer.from(box.sigma_serialize_bytes()).toString('hex')
      )
    );

    // generate input boxes objects
    let remainingAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    const inBoxes = inputs.map((serializedBox) =>
      wasm.ErgoBox.sigma_parse_bytes(Buffer.from(serializedBox, 'hex'))
    );
    const inErgoBoxes = wasm.ErgoBoxes.empty();
    inBoxes.forEach((box) => {
      inErgoBoxes.add(box);

      // add box assets to `remainingAssets`
      remainingAssets = ChainUtils.sumAssetBalance(
        remainingAssets,
        ErgoUtils.getBoxAssets(box)
      );
    });

    // generate data input boxes objects
    const dataInBoxes = dataInputs.map((serializedBox) =>
      wasm.ErgoBox.sigma_parse_bytes(Buffer.from(serializedBox, 'hex'))
    );
    const dataInErgoBoxes = wasm.ErgoBoxes.empty();
    dataInBoxes.forEach((box) => dataInErgoBoxes.add(box));
    const inData = new wasm.DataInputs();
    dataInBoxes.forEach((box) => inData.add(new wasm.DataInput(box.box_id())));

    // generate output boxes objects
    const outBoxCandidates = wasm.ErgoBoxCandidates.empty();
    const currentHeight = await this.network.getHeight();
    order.forEach((order) => {
      // create box
      const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
        wasm.BoxValue.from_i64(
          wasm.I64.from_str(order.assets.nativeToken.toString())
        ),
        wasm.Contract.new(
          wasm.Address.from_base58(order.address).to_ergo_tree()
        ),
        currentHeight
      );
      // add box tokens
      order.assets.tokens.forEach((token) =>
        boxBuilder.add_token(
          wasm.TokenId.from_str(token.id),
          wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString()))
        )
      );
      // add extra data to box R4 as coll_coll_byte
      if (order.extra)
        boxBuilder.set_register_value(
          4,
          wasm.Constant.from_coll_coll_byte([Buffer.from(order.extra, 'hex')])
        );

      // build and add box
      const box = boxBuilder.build();
      outBoxCandidates.add(box);

      // reduce box assets from `remainingAssets`
      remainingAssets = ChainUtils.subtractAssetBalance(
        remainingAssets,
        ErgoUtils.getBoxAssets(box),
        this.configs.minBoxValue
      );
    });

    // create change box
    const boxBuilder = new wasm.ErgoBoxCandidateBuilder(
      wasm.BoxValue.from_i64(
        wasm.I64.from_str(
          (remainingAssets.nativeToken - this.configs.fee).toString()
        )
      ),
      wasm.Contract.new(
        wasm.Address.from_base58(this.configs.lockAddress).to_ergo_tree()
      ),
      currentHeight
    );
    // add change box tokens
    remainingAssets.tokens.forEach((token) =>
      boxBuilder.add_token(
        wasm.TokenId.from_str(token.id),
        wasm.TokenAmount.from_i64(wasm.I64.from_str(token.value.toString()))
      )
    );
    // build and add change box
    const changeBox = boxBuilder.build();
    outBoxCandidates.add(changeBox);

    // create the box selector in tx builder
    const inBoxSelection = new wasm.BoxSelection(
      inErgoBoxes,
      new wasm.ErgoBoxAssetsDataList()
    );

    // create the transaction
    const txCandidate = wasm.TxBuilder.new(
      inBoxSelection,
      outBoxCandidates,
      currentHeight,
      wasm.BoxValue.from_i64(wasm.I64.from_str(this.configs.fee.toString())),
      wasm.Address.from_base58(this.configs.lockAddress)
    );
    txCandidate.set_data_inputs(inData);
    const tx = txCandidate.build();

    // create ReducedTransaction object
    const ctx = await this.network.getStateContext();
    const reducedTx = wasm.ReducedTransaction.from_unsigned_tx(
      tx,
      inErgoBoxes,
      dataInErgoBoxes,
      ctx
    );

    // create PaymentTransaction object
    const txBytes = Serializer.serialize(reducedTx);
    const txId = reducedTx.unsigned_tx().id().to_str();
    const ergoTx = new ErgoTransaction(
      txId,
      eventId,
      txBytes,
      inputs.map((boxBytes) => Buffer.from(boxBytes, 'hex')),
      dataInputs.map((boxBytes) => Buffer.from(boxBytes, 'hex')),
      txType
    );

    this.logger.info(
      `Ergo transaction [${txId}] as type [${txType}] generated for event [${eventId}]`
    );
    return ergoTx;
  };

  /**
   * gets input and output assets of a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  getTransactionAssets = async (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    const ergoTx = transaction as ErgoTransaction;
    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract input boxes assets
    ergoTx.inputBoxes.forEach((serializedBox) => {
      const boxAssets = this.getBoxInfo(
        wasm.ErgoBox.sigma_parse_bytes(serializedBox)
      ).assets;
      inputAssets = ChainUtils.sumAssetBalance(inputAssets, boxAssets);
    });

    const tx = Serializer.deserialize(transaction.txBytes).unsigned_tx();
    const outputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract output boxes assets
    for (let i = 0; i < tx.output_candidates().len(); i++) {
      const output = tx.output_candidates().get(i);
      outputAssets.nativeToken += BigInt(output.value().as_i64().to_str());
      for (let j = 0; j < output.tokens().len(); j++) {
        const targetToken = outputAssets.tokens.find(
          (item) => item.id === output.tokens().get(j).id().to_str()
        );
        if (targetToken)
          targetToken.value += BigInt(
            output.tokens().get(j).amount().as_i64().to_str()
          );
        else
          outputAssets.tokens.push({
            id: output.tokens().get(j).id().to_str(),
            value: BigInt(output.tokens().get(j).amount().as_i64().to_str()),
          });
      }
    }

    return {
      inputAssets,
      outputAssets,
    };
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes).unsigned_tx();

    const order: PaymentOrder = [];
    for (let i = 0; i < tx.output_candidates().len(); i++) {
      const output = tx.output_candidates().get(i);
      const assets = ErgoUtils.getBoxAssets(output);
      const r4Value = output.register_value(4)?.to_coll_coll_byte()[0];

      // skip change box and fee box
      if (
        output.ergo_tree().to_base16_bytes() === ErgoChain.feeBoxErgoTree ||
        (tx.output_candidates().len() - i === 2 &&
          output.ergo_tree().to_base16_bytes() ===
            wasm.Address.from_base58(this.configs.lockAddress)
              .to_ergo_tree()
              .to_base16_bytes())
      )
        continue;

      const payment: SinglePayment = {
        address: wasm.Address.recreate_from_ergo_tree(
          output.ergo_tree()
        ).to_base58(wasm.NetworkPrefix.Mainnet),
        assets: assets,
      };
      if (r4Value) payment.extra = Buffer.from(r4Value).toString('hex');
      order.push(payment);
    }

    return order;
  };

  /**
   * verifies transaction fee for a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  verifyTransactionFee = (transaction: PaymentTransaction): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes).unsigned_tx();
    const outputBoxes = tx.output_candidates();
    for (let i = 0; i < outputBoxes.len(); i++) {
      const box = outputBoxes.get(i);
      if (box.ergo_tree().to_base16_bytes() === ErgoChain.feeBoxErgoTree) {
        if (BigInt(box.value().as_i64().to_str()) > this.configs.fee) {
          this.logger.debug(
            `Tx [${transaction.txId}] invalid: Transaction fee [${box
              .value()
              .as_i64()
              .to_str()}] is more than maximum allowed fee [${
              this.configs.fee
            }]`
          );
          return false;
        } else return true;
      }
    }
    throw new ImpossibleBehavior(`No box matching fee box ergo tree found`);
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event verified
   */
  verifyEvent = async (
    event: EventTrigger,
    feeConfig: Fee
  ): Promise<boolean> => {
    const eventId = Buffer.from(
      blake2b(event.sourceTxId, undefined, 32)
    ).toString('hex');

    try {
      const blockTxs = await this.network.getBlockTransactionIds(
        event.sourceBlockId
      );
      if (!blockTxs.includes(event.sourceTxId)) return false;
      const tx = await this.network.getTransaction(
        event.sourceTxId,
        event.sourceBlockId
      );
      const blockHeight = (await this.network.getBlockInfo(event.sourceBlockId))
        .height;
      const data = this.network.extractor.get(
        Buffer.from(tx.sigma_serialize_bytes()).toString('hex')
      );
      if (!data) {
        this.logger.info(
          `Event [${eventId}] is not valid, failed to extract rosen data from lock transaction`
        );
        return false;
      }
      if (
        event.fromChain == ERGO_CHAIN &&
        event.toChain == data.toChain &&
        event.networkFee == data.networkFee &&
        event.bridgeFee == data.bridgeFee &&
        event.amount == data.amount &&
        event.sourceChainTokenId == data.sourceChainTokenId &&
        event.targetChainTokenId == data.targetChainTokenId &&
        event.toAddress == data.toAddress &&
        event.fromAddress == data.fromAddress &&
        event.sourceChainHeight == blockHeight
      ) {
        try {
          // check if amount is more than fees
          const eventAmount = BigInt(event.amount);
          let bridgeFee = BigInt(event.bridgeFee);
          if (feeConfig.bridgeFee > bridgeFee) bridgeFee = feeConfig.bridgeFee;
          const transferringAmountFee =
            (eventAmount * feeConfig.feeRatio) / this.feeRatioDivisor;
          if (transferringAmountFee > bridgeFee)
            bridgeFee = transferringAmountFee;
          const networkFee =
            BigInt(event.networkFee) > feeConfig.networkFee
              ? BigInt(event.networkFee)
              : feeConfig.networkFee;
          if (eventAmount < bridgeFee + networkFee) {
            this.logger.info(
              `Event [${eventId}] is not valid, event amount [${eventAmount}] is less than sum of bridgeFee [${bridgeFee}] and networkFee [${networkFee}]`
            );
            return false;
          }
        } catch (e) {
          throw new UnexpectedApiError(
            `Failed in comparing event amount to fees: ${e}`
          );
        }
        this.logger.info(`Event [${eventId}] has been successfully validated`);
        return true;
      } else {
        this.logger.info(
          `Event [${eventId}] is not valid, event data does not match with lock tx [${event.sourceTxId}]`
        );
        return false;
      }
    } catch (e) {
      if (e instanceof NotFoundError) {
        this.logger.info(
          `Event [${eventId}] is not valid, lock tx [${event.sourceTxId}] is not available in network`
        );
        return false;
      } else if (
        e instanceof FailedError ||
        e instanceof NetworkError ||
        e instanceof UnexpectedApiError
      ) {
        throw Error(`Skipping event [${eventId}] validation: ${e}`);
      } else {
        this.logger.warn(`Event [${eventId}] validation failed: ${e}`);
        return false;
      }
    }
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   *   1. change box address should equal to lock address
   *   2. change box should not have register
   * @param transaction the PaymentTransaction
   * @returns true if the transaction verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes).unsigned_tx();
    const outputBoxes = tx.output_candidates();

    const box = outputBoxes.get(outputBoxes.len() - 2);
    const boxErgoTree = box.ergo_tree().to_base16_bytes();
    const lockErgoTree = wasm.Address.from_base58(this.configs.lockAddress)
      .to_ergo_tree()
      .to_base16_bytes();
    if (boxErgoTree === lockErgoTree) {
      const r4Value = box.register_value(4);
      if (r4Value) {
        this.logger.debug(
          `Tx [${
            transaction.txId
          }] is invalid. Change box has value [${r4Value.encode_to_base16()}] in R4`
        );
        return false;
      }
      return true;
    } else {
      this.logger.debug(
        `Tx [${transaction.txId}] is invalid. Change box ergoTree [${boxErgoTree}] is not equal to lock address ergoTree [${lockErgoTree}]`
      );
      return false;
    }
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @returns true if the transaction is still valid
   */
  isTxValid = async (transaction: PaymentTransaction): Promise<boolean> => {
    // deserialize transaction
    const tx = Serializer.signedDeserialize(transaction.txBytes);

    // check if any input is spent or invalid
    let valid = true;
    for (let i = 0; i < tx.inputs().len(); i++) {
      const box = tx.inputs().get(i);
      valid =
        valid &&
        (await this.network.isBoxUnspentAndValid(box.box_id().to_str()));
    }
    return valid;
  };

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @param signFunction the function to sign transaction
   * @returns the signed transaction
   */
  signTransaction = (
    transaction: PaymentTransaction,
    requiredSign: number
  ): Promise<PaymentTransaction> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const ergoTx = transaction as ErgoTransaction;
    const txInputs = ergoTx.inputBoxes.map((boxBytes) =>
      wasm.ErgoBox.sigma_parse_bytes(boxBytes)
    );
    const txDataInputs = ergoTx.dataInputs.map((boxBytes) =>
      wasm.ErgoBox.sigma_parse_bytes(boxBytes)
    );

    return this.signFunction(tx, requiredSign, txInputs, txDataInputs).then(
      async (signedTx) => {
        const inputBoxes = wasm.ErgoBoxes.empty();
        txInputs.forEach((box) => inputBoxes.add(box));
        return new ErgoTransaction(
          ergoTx.txId,
          ergoTx.eventId,
          Serializer.signedSerialize(signedTx),
          ergoTx.inputBoxes,
          ergoTx.dataInputs,
          ergoTx.txType
        );
      }
    );
  };

  /**
   * extracts confirmation status for a transaction
   * @param transactionId the transaction id
   * @param transactionType type of the transaction
   * @returns the transaction confirmation status
   */
  getTxConfirmationStatus = async (
    transactionId: string,
    transactionType: string
  ): Promise<ConfirmationStatus> => {
    let expectedConfirmation = 0;
    if (transactionType === TransactionTypes.lock)
      expectedConfirmation = this.configs.observationTxConfirmation;
    else if (
      transactionType === TransactionTypes.payment ||
      transactionType === TransactionTypes.reward
    )
      expectedConfirmation = this.configs.paymentTxConfirmation;
    else if (transactionType === TransactionTypes.coldStorage)
      expectedConfirmation = this.configs.coldTxConfirmation;
    else
      throw new Error(`Transaction type [${transactionType}] is not defined`);

    const confirmation = await this.network.getTxConfirmation(transactionId);
    if (confirmation >= expectedConfirmation)
      return ConfirmationStatus.ConfirmedEnough;
    else if (confirmation === -1) return ConfirmationStatus.NotFound;
    else return ConfirmationStatus.NotConfirmedEnough;
  };

  /**
   * gets the amount of each asset in the lock address
   * @returns an object containing the amount of each asset
   */
  getLockAddressAssets = async (): Promise<AssetBalance> => {
    return await this.network.getAddressAssets(this.configs.lockAddress);
  };

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  submitTransaction = async (
    transaction: PaymentTransaction
  ): Promise<void> => {
    // deserialize transaction
    const tx = Serializer.signedDeserialize(transaction.txBytes);

    // send transaction
    try {
      const response = await this.network.submitTransaction(tx);
      this.logger.info(
        `Ergo Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting Ergo transaction [${transaction.txId}]: ${e}`
      );
      if (e instanceof Error && e.stack) {
        this.logger.warn(e.stack);
      }
    }
  };

  /**
   * checks if a transaction is in mempool (returns false if the chain has no mempool)
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  isTxInMempool = async (transactionId: string): Promise<boolean> => {
    const mempoolTxIds = (await this.network.getMempoolTransactions()).map(
      (tx) => tx.id().to_str()
    );
    return mempoolTxIds.includes(transactionId);
  };

  /**
   * gets the minimum amount of native token for assetTransfer
   * @returns the minimum amount
   */
  getMinimumNativeToken = (): bigint => {
    return this.configs.minBoxValue;
  };

  /**
   * gets the RWT token id
   * @returns RWT token id
   */
  getRWTToken = (): string => {
    return this.configs.rwtId;
  };

  /**
   * generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
   * @param address the address
   * @param tokenId the token id
   * @returns a Map from input box id to serialized string of output box
   */
  getMempoolBoxMapping = async (
    address: string,
    tokenId?: string
  ): Promise<Map<string, wasm.ErgoBox | undefined>> => {
    // iterate over mempool transactions
    const mempoolTxs = await this.network.getMempoolTransactions();
    const trackMap = this.getTransactionsBoxMapping(
      mempoolTxs,
      address,
      tokenId
    );

    return trackMap;
  };

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (box: wasm.ErgoBox): BoxInfo => {
    return {
      id: box.box_id().to_str(),
      assets: ErgoUtils.getBoxAssets(box),
    };
  };

  /**
   * extracts box height
   * @param serializedBox the serialized string of the box
   * @returns the box height
   */
  getBoxHeight = (serializedBox: string): number => {
    // deserialize box
    const box = wasm.ErgoBox.sigma_parse_bytes(
      Buffer.from(serializedBox, 'hex')
    );

    return box.creation_height();
  };

  /**
   * extracts watcher id from R4 of the box
   * @param serializedBox the serialized string of the box
   * @returns watcher id
   */
  getBoxWID = (serializedBox: string): string => {
    // deserialize box
    const box = wasm.ErgoBox.sigma_parse_bytes(
      Buffer.from(serializedBox, 'hex')
    );

    // extract wid
    const wid = box.register_value(4)?.to_coll_coll_byte()[0];
    if (wid === undefined) {
      const boxId = box.box_id().to_str();
      throw new Error(`failed to read WID from register R4 of box [${boxId}]`);
    }
    return Buffer.from(wid).toString('hex');
  };

  /**
   * gets amount of rwt in the box
   * @param serializedBox the serialized string of the box
   * @returns rwt amount
   */
  getBoxRWT = (serializedBox: string): bigint => {
    // deserialize box
    const box = wasm.ErgoBox.sigma_parse_bytes(
      Buffer.from(serializedBox, 'hex')
    );

    // extract wid
    if (box.tokens().len() < 1) {
      const boxId = box.box_id().to_str();
      throw new Error(
        `failed to read amount of RWT from box [${boxId}]: Box has no token`
      );
    }
    return BigInt(box.tokens().get(0).amount().as_i64().to_str());
  };

  /**
   * generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
   * @param transactions list of transactions
   * @param address the address
   * @param tokenId the token id
   * @returns a Map from input box id to serialized string of output box
   */
  protected getTransactionsBoxMapping = (
    transactions: wasm.Transaction[],
    address: string,
    tokenId?: string
  ): Map<string, wasm.ErgoBox | undefined> => {
    // initialize variables
    const ergoTree = wasm.Address.from_base58(address)
      .to_ergo_tree()
      .to_base16_bytes();
    const trackMap = new Map<string, wasm.ErgoBox | undefined>();

    // iterate over mempool transactions
    transactions.forEach((tx) => {
      // deserialize transaction

      // iterate over tx inputs
      for (let i = 0; i < tx.inputs().len(); i++) {
        let trackedBox: wasm.ErgoBox | undefined;
        // iterate over tx outputs
        for (let j = 0; j < tx.outputs().len(); j++) {
          const output = tx.outputs().get(j);
          // check if box satisfy conditions
          if (output.ergo_tree().to_base16_bytes() !== ergoTree) continue;
          if (tokenId) {
            const tokenIds: Array<string> = [];
            for (let k = 0; k < output.tokens().len(); k++)
              tokenIds.push(output.tokens().get(k).id().to_str());

            if (!tokenIds.includes(tokenId)) continue;
          }

          // mark the tracked lock box
          trackedBox = output;
          break;
        }

        // add input box with serialized tracked box to trackMap
        const input = tx.inputs().get(i);
        trackMap.set(input.box_id().to_str(), trackedBox);
      }
    });

    return trackMap;
  };

  /**
   * gets the guards config box which contains all guards public keys
   * @param guardNFT the guard NFT tokenId
   * @param address address containing guard config box
   * @return the serialized string of guard box
   */
  getGuardsConfigBox = async (
    guardNFT: string,
    address: string
  ): Promise<string> => {
    const guardBox = await this.network.getBoxesByTokenId(guardNFT, address);
    if (guardBox.length === 0)
      throw new Error(`no guards config box found with NFT [${guardNFT}]`);
    else if (guardBox.length > 1)
      throw new Error(
        `Found [${guardBox.length}] guards config box with NFT [${guardNFT}]`
      );
    else
      return Buffer.from(guardBox[0].sigma_serialize_bytes()).toString('hex');
  };

  /**
   * verifies rwt token of event box
   * @param eventSerializedBox serialized string of the event box
   * @param expectedRWT event fromChain RWT tokenId
   */
  verifyEventRWT = (
    eventSerializedBox: string,
    expectedRWT: string
  ): boolean => {
    const eventBox = wasm.ErgoBox.sigma_parse_bytes(
      Buffer.from(eventSerializedBox, 'hex')
    );
    return (
      eventBox.tokens().len() !== 0 &&
      eventBox.tokens().get(0).id().to_str() === expectedRWT
    );
  };
}

export default ErgoChain;
