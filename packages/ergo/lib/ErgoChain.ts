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
import { Buffer } from 'buffer';

class ErgoChain extends AbstractUtxoChain {
  static feeBoxErgoTree =
    '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304';
  declare network: AbstractErgoNetwork;
  declare configs: ErgoConfigs;

  constructor(
    network: AbstractErgoNetwork,
    configs: ErgoConfigs,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
  }

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param inputs the inputs for transaction
   * @param dataInputs the data inputs for transaction
   * @returns the generated payment transaction
   */
  generateTransaction = async (
    eventId: string,
    txType: string,
    order: PaymentOrder,
    inputs: Array<string>,
    dataInputs: Array<string>
  ): Promise<PaymentTransaction> => {
    let remainingAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    // generate input boxes objects
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
      remainingAssets = ChainUtils.reduceAssetBalance(
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
  getTransactionAssets = (
    transaction: PaymentTransaction
  ): TransactionAssetBalance => {
    const ergoTx = transaction as ErgoTransaction;
    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract input boxes assets
    ergoTx.inputBoxes.forEach((serializedBox) => {
      const boxAssets = this.getBoxInfo(
        Buffer.from(serializedBox).toString('hex')
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
        output.ergo_tree().to_base16_bytes() ===
          wasm.Address.from_base58(this.configs.lockAddress)
            .to_ergo_tree()
            .to_base16_bytes()
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
   * @param RwtId the RWT token id in the event trigger box
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event verified
   */
  verifyEvent = async (
    event: EventTrigger,
    RwtId: string,
    feeConfig: Fee
  ): Promise<boolean> => {
    const eventId = Buffer.from(
      blake2b(event.sourceTxId, undefined, 32)
    ).toString('hex');
    // Verifying watcher RWTs
    if (RwtId !== this.configs.rwtId) {
      this.logger.info(
        `event [${eventId}] is not valid, event RWT is not compatible with the ergo RWT id`
      );
      return false;
    }
    try {
      const blockTxs = await this.network.getBlockTransactionIds(
        event.sourceBlockId
      );
      if (!blockTxs.includes(event.sourceTxId)) return false;
      const serializedTx = await this.network.getTransaction(
        event.sourceTxId,
        event.sourceBlockId
      );
      const data = this.network.extractor.get(serializedTx);
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
        event.fromAddress == data.fromAddress
      ) {
        try {
          // check if amount is more than fees
          const eventAmount = BigInt(event.amount);
          const bridgeFee =
            BigInt(event.bridgeFee) > feeConfig.bridgeFee
              ? BigInt(event.bridgeFee)
              : feeConfig.bridgeFee;
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
    requiredSign: number,
    signFunction: (
      tx: wasm.ReducedTransaction,
      requiredSign: number,
      boxes: Array<wasm.ErgoBox>,
      dataBoxes?: Array<wasm.ErgoBox>
    ) => Promise<wasm.Transaction>
  ): Promise<PaymentTransaction> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const ergoTx = transaction as ErgoTransaction;
    const txInputs = ergoTx.inputBoxes.map((boxBytes) =>
      wasm.ErgoBox.sigma_parse_bytes(boxBytes)
    );
    const txDataInputs = ergoTx.dataInputs.map((boxBytes) =>
      wasm.ErgoBox.sigma_parse_bytes(boxBytes)
    );

    return signFunction(tx, requiredSign, txInputs, txDataInputs).then(
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
   * extracts confirmation status for a payment transaction
   * @param transactionId the payment transaction id
   * @returns the transaction confirmation status
   */
  getPaymentTxConfirmationStatus = async (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    const confirmation = await this.network.getTxConfirmation(transactionId);
    if (confirmation >= this.configs.paymentTxConfirmation)
      return ConfirmationStatus.ConfirmedEnough;
    else if (confirmation === -1) return ConfirmationStatus.NotFound;
    else return ConfirmationStatus.NotConfirmedEnough;
  };

  /**
   * extracts confirmation status for an asset transfer transaction
   * @param transactionId the asset transfer transaction id
   * @returns the transaction confirmation status
   */
  getColdStorageTxConfirmationStatus = async (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    const confirmation = await this.network.getTxConfirmation(transactionId);
    if (confirmation >= this.configs.coldTxConfirmation)
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
      const response = await this.network.submitTransaction(tx.to_json());
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
    const mempoolTxs = await this.network.getMempoolTransactions();
    const mempoolTxIds = mempoolTxs.map((serializedTx) =>
      wasm.Transaction.sigma_parse_bytes(Buffer.from(serializedTx, 'hex'))
        .id()
        .to_str()
    );
    return mempoolTxIds.includes(transactionId);
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
  ): Promise<Map<string, string | undefined>> => {
    // initialize variables
    const ergoTree = wasm.Address.from_base58(address)
      .to_ergo_tree()
      .to_base16_bytes();
    const trackMap = new Map<string, string | undefined>();

    // iterate over mempool transactions
    const mempoolTxs = await this.network.getMempoolTransactions();
    mempoolTxs.forEach((serializedTx) => {
      // deserialize transaction
      const tx = wasm.Transaction.sigma_parse_bytes(
        Buffer.from(serializedTx, 'hex')
      );

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
        trackMap.set(
          input.box_id().to_str(),
          trackedBox
            ? Buffer.from(trackedBox.sigma_serialize_bytes()).toString('hex')
            : undefined
        );
      }
    });

    return trackMap;
  };

  /**
   * extracts box id and assets of a box
   * @param serializedBox the serialized string of the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (serializedBox: string): BoxInfo => {
    // deserialize box
    const box = wasm.ErgoBox.sigma_parse_bytes(
      Buffer.from(serializedBox, 'hex')
    );

    return {
      id: box.box_id().to_str(),
      assets: ErgoUtils.getBoxAssets(box),
    };
  };
}

export default ErgoChain;
