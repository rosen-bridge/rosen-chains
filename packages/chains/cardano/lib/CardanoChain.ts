import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import {
  BigNum,
  hash_transaction,
} from '@emurgo/cardano-serialization-lib-nodejs';
import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { Fee } from '@rosen-bridge/minimum-fee';
import { TokenMap } from '@rosen-bridge/tokens';
import {
  AbstractUtxoChain,
  AssetBalance,
  BoxInfo,
  ChainUtils,
  ConfirmationStatus,
  EventTrigger,
  FailedError,
  NetworkError,
  NotEnoughAssetsError,
  NotEnoughValidBoxesError,
  NotFoundError,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  SinglePayment,
  TransactionAssetBalance,
  TransactionType,
  UnexpectedApiError,
} from '@rosen-chains/abstract-chain';
import { blake2b } from 'blakejs';
import JSONBigInt from '@rosen-bridge/json-bigint';
import CardanoTransaction from './CardanoTransaction';
import CardanoUtils from './CardanoUtils';
import cardanoUtils from './CardanoUtils';
import { CARDANO_CHAIN, txBuilderConfig } from './constants';
import AbstractCardanoNetwork from './network/AbstractCardanoNetwork';
import Serializer from './Serializer';
import {
  CardanoAsset,
  CardanoBoxCandidate,
  CardanoConfigs,
  CardanoUtxo,
} from './types';
import JsonBigInt from '@rosen-bridge/json-bigint';

class CardanoChain extends AbstractUtxoChain<CardanoUtxo> {
  declare network: AbstractCardanoNetwork;
  declare configs: CardanoConfigs;
  tokenMap: TokenMap;
  feeRatioDivisor: bigint;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;

  constructor(
    network: AbstractCardanoNetwork,
    configs: CardanoConfigs,
    tokenMap: TokenMap,
    feeRatioDivisor: bigint,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
    this.tokenMap = tokenMap;
    this.feeRatioDivisor = feeRatioDivisor;
    this.signFunction = signFunction;
  }

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes);

    const order: PaymentOrder = [];
    for (let i = 0; i < tx.body().outputs().len(); i++) {
      const output = tx.body().outputs().get(i);

      // skip change box (last box & address equal to bank address)
      if (
        i === tx.body().outputs().len() - 1 &&
        output.address().to_bech32() === this.configs.addresses.lock
      )
        continue;

      const payment: SinglePayment = {
        address: output.address().to_bech32(),
        assets: CardanoUtils.getBoxAssets(output),
      };
      order.push(payment);
    }
    return order;
  };

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param unsignedTransactions ongoing unsigned PaymentTransactions (used for preventing double spend)
   * @param serializedSignedTransactions the serialized string of ongoing signed transactions in Cardano Wasm format (used for chaining transactions)
   * @returns the generated payment transaction
   */
  generateTransaction = async (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[]
  ): Promise<PaymentTransaction> => {
    this.logger.debug(
      `Generating Cardano transaction for Order: ${JsonBigInt.stringify(order)}`
    );
    // calculate required assets
    const requiredAssets = order
      .map((order) => order.assets)
      .reduce(ChainUtils.sumAssetBalance, {
        nativeToken: this.getMinimumNativeToken() + this.configs.fee,
        tokens: [],
      });
    this.logger.debug(
      `Required assets: ${JsonBigInt.stringify(requiredAssets)}`
    );

    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededADA = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. ADA: ${neededADA}, Tokens: ${neededTokens}`
      );
    }

    const forbiddenBoxIds = unsignedTransactions.flatMap((paymentTx) => {
      const txBody = Serializer.deserialize(paymentTx.txBytes).body();
      const ids: string[] = [];
      for (let i = 0; i < txBody.inputs().len(); i++)
        ids.push(CardanoUtils.getBoxId(txBody.inputs().get(i)));

      return ids;
    });
    const trackMap = this.getTransactionsBoxMapping(
      serializedSignedTransactions.map((serializedTx) =>
        CardanoWasm.Transaction.from_bytes(Buffer.from(serializedTx, 'hex'))
      ),
      this.configs.addresses.lock
    );

    const coveredBoxes = await this.getCoveringBoxes(
      this.configs.addresses.lock,
      requiredAssets,
      forbiddenBoxIds,
      trackMap
    );
    if (!coveredBoxes.covered) {
      const neededAdas = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughValidBoxesError(
        `Available boxes didn't cover required assets. ADA: ${neededAdas}, Tokens: ${neededTokens}`
      );
    }
    const bankBoxes = coveredBoxes.boxes;

    const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderConfig);
    let orderValue = BigNum.zero();
    const orderAssets: Map<string, bigint> = new Map();

    // add outputs
    order.forEach((order) => {
      if (order.extra) {
        throw Error('Cardano does not support extra data in payment order');
      }
      // accumulate value
      orderValue = orderValue.checked_add(
        CardanoUtils.bigIntToBigNum(order.assets.nativeToken)
      );

      // create order output
      const address = CardanoWasm.Address.from_bech32(order.address);
      const value = CardanoWasm.Value.new(
        CardanoUtils.bigIntToBigNum(order.assets.nativeToken)
      );
      // inserting assets
      const paymentMultiAsset = CardanoWasm.MultiAsset.new();
      order.assets.tokens.forEach((asset) => {
        // accumulate assets
        if (orderAssets.has(asset.id)) {
          orderAssets.set(asset.id, orderAssets.get(asset.id)! + asset.value);
        } else {
          orderAssets.set(asset.id, asset.value);
        }
        const paymentAssetInfo = CardanoUtils.getCardanoAssetInfo(
          asset.id,
          this.tokenMap
        );
        const paymentAssetPolicyId: CardanoWasm.ScriptHash =
          CardanoWasm.ScriptHash.from_hex(paymentAssetInfo.policyId);
        const paymentAssetAssetName: CardanoWasm.AssetName =
          CardanoWasm.AssetName.new(
            Buffer.from(paymentAssetInfo.assetName, 'hex')
          );
        const paymentAssets = CardanoWasm.Assets.new();
        paymentAssets.insert(
          paymentAssetAssetName,
          CardanoUtils.bigIntToBigNum(asset.value)
        );
        paymentMultiAsset.insert(paymentAssetPolicyId, paymentAssets);
      });
      value.set_multiasset(paymentMultiAsset);
      const orderBox = CardanoWasm.TransactionOutput.new(address, value);
      txBuilder.add_output(orderBox);
    });

    // add inputs
    bankBoxes.forEach((box) => {
      const txHash = CardanoWasm.TransactionHash.from_bytes(
        Buffer.from(box.txId, 'hex')
      );
      const inputBox = CardanoWasm.TransactionInput.new(txHash, box.index);
      txBuilder.add_input(
        CardanoWasm.Address.from_bech32(this.configs.addresses.lock),
        inputBox,
        CardanoWasm.Value.new(orderValue)
      );
    });

    // create change output
    const inputBoxesAssets = CardanoUtils.calculateInputBoxesAssets(bankBoxes);
    const changeBoxMultiAsset = CardanoWasm.MultiAsset.new();
    inputBoxesAssets.assets.forEach((value, key) => {
      const assetInfo = key.split(',');
      const assetName = CardanoWasm.AssetName.new(
        Buffer.from(assetInfo[1], 'hex')
      );
      const policyId = CardanoWasm.ScriptHash.from_hex(assetInfo[0]);
      const fingerprint = CardanoUtils.createFingerprint(policyId, assetName);
      const spentValue = CardanoUtils.bigIntToBigNum(
        orderAssets.get(fingerprint) || 0n
      );
      if (value.compare(spentValue) === 0) return;
      changeBoxMultiAsset.set_asset(
        policyId,
        assetName,
        value.checked_sub(spentValue)
      );
    });
    const changeBoxLovelace = inputBoxesAssets.lovelace
      .checked_sub(orderValue)
      .checked_sub(CardanoUtils.bigIntToBigNum(this.configs.fee));

    const changeAmount: CardanoWasm.Value =
      CardanoWasm.Value.new(changeBoxLovelace);
    changeAmount.set_multiasset(changeBoxMultiAsset);
    this.logger.debug(`Change box amount: ${changeAmount.to_json()}`);
    const changeBox = CardanoWasm.TransactionOutput.new(
      CardanoWasm.Address.from_bech32(this.configs.addresses.lock),
      changeAmount
    );
    txBuilder.add_output(changeBox);

    // set ttl and fee
    txBuilder.set_ttl((await this.network.currentSlot()) + this.configs.txTtl);
    txBuilder.set_fee(CardanoUtils.bigIntToBigNum(this.configs.fee));

    // create the transaction
    const txBody = txBuilder.build();
    const tx = CardanoWasm.Transaction.new(
      txBody,
      CardanoWasm.TransactionWitnessSet.new(),
      undefined
    );
    const txBytes = Serializer.serialize(tx);
    const txId = Buffer.from(
      CardanoWasm.hash_transaction(txBody).to_bytes()
    ).toString('hex');

    const cardanoTx = new CardanoTransaction(
      txId,
      eventId,
      txBytes,
      txType,
      bankBoxes.map((box) => JSONBigInt.stringify(box))
    );

    this.logger.info(
      `Cardano transaction [${txId}] as type [${txType}] generated for event [${eventId}]`
    );
    return cardanoTx;
  };

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (box: CardanoUtxo): BoxInfo => {
    return {
      id: CardanoUtils.getBoxId(box),
      assets: {
        nativeToken: BigInt(box.value),
        tokens: box.assets.map((asset) => ({
          id: asset.fingerprint,
          value: BigInt(asset.quantity),
        })),
      },
    };
  };

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  submitTransaction = async (
    transaction: PaymentTransaction
  ): Promise<void> => {
    // deserialize transaction
    const tx = Serializer.deserialize(transaction.txBytes);

    // send transaction
    try {
      const response = await this.network.submitTransaction(tx);
      this.logger.info(
        `Cardano Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting Cardano transaction [${transaction.txId}]: ${e}`
      );
      if (e instanceof Error && e.stack) {
        this.logger.warn(e.stack);
      }
    }
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
    const cardanoTx = transaction as CardanoTransaction;
    return this.signFunction(hash_transaction(tx.body()).to_bytes()).then(
      (signature: string) => {
        const signedTx = this.buildSignedTransaction(tx.body(), signature);
        return new CardanoTransaction(
          cardanoTx.txId,
          cardanoTx.eventId,
          Serializer.serialize(signedTx),
          cardanoTx.txType,
          cardanoTx.inputUtxos
        );
      }
    );
  };

  /**
   * gets input and output assets of a payment transaction
   * @param transaction the payment transaction
   * @returns assets of input and output boxes
   */
  getTransactionAssets = async (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const cardanoTx = transaction as CardanoTransaction;
    const txBody = tx.body();

    let inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    // extract input box assets
    for (let i = 0; i < cardanoTx.inputUtxos.length; i++) {
      const input = JSONBigInt.parse(cardanoTx.inputUtxos[i]) as CardanoUtxo;
      const boxAssets = this.getBoxInfo(input).assets;
      inputAssets = ChainUtils.sumAssetBalance(inputAssets, boxAssets);
    }

    let outputAssets: AssetBalance = {
      nativeToken: BigInt(tx.body().fee().to_str()),
      tokens: [],
    };
    for (let i = 0; i < txBody.outputs().len(); i++) {
      const output = txBody.outputs().get(i);
      const boxAssets = CardanoUtils.getBoxAssets(output);
      outputAssets = ChainUtils.sumAssetBalance(outputAssets, boxAssets);
    }

    return {
      inputAssets,
      outputAssets,
    };
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
  ): Promise<Map<string, CardanoUtxo | undefined>> => {
    const mempoolTxs = await this.network.getMempoolTransactions();
    const trackMap = new Map<string, CardanoUtxo | undefined>();
    mempoolTxs.forEach((cardanoTx) => {
      // iterate over tx inputs
      for (let i = 0; i < cardanoTx.inputs.length; i++) {
        let trackedBox: CardanoBoxCandidate | undefined;
        // iterate over tx outputs
        let index = 0;
        for (index = 0; index < cardanoTx.outputs.length; index++) {
          const output = cardanoTx.outputs[index];
          // check if box satisfy conditions
          if (output.address !== address) continue;
          if (tokenId) {
            if (!output.assets.find((asset) => asset.fingerprint === tokenId))
              continue;
          }

          // mark the tracked box
          trackedBox = output;
          break;
        }

        // add input box to trackMap
        const input = cardanoTx.inputs[i];
        trackMap.set(
          CardanoUtils.getBoxId(input),
          trackedBox
            ? CardanoUtils.convertCandidateToUtxo(
                trackedBox,
                cardanoTx.id,
                index
              )
            : undefined
        );
      }
    });

    return trackMap;
  };

  /**
   * checks if a transaction is in mempool
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  isTxInMempool = async (transactionId: string): Promise<boolean> => {
    const mempoolTxIds = (await this.network.getMempoolTransactions()).map(
      (tx) => tx.id
    );

    return mempoolTxIds.includes(transactionId);
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the payment transaction
   * @param _signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = async (
    transaction: PaymentTransaction,
    _signingStatus: SigningStatus = SigningStatus.Signed
  ): Promise<boolean> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const txBody = tx.body();

    // check ttl
    const ttl = txBody.ttl();
    if (ttl && ttl < (await this.network.currentSlot())) {
      return false;
    }

    // let valid = true;
    for (let i = 0; i < txBody.inputs().len(); i++) {
      const box = txBody.inputs().get(i);
      if (
        !(await this.network.isBoxUnspentAndValid(CardanoUtils.getBoxId(box)))
      )
        return false;
    }
    return true;
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
      const data = this.network.extractor.get(JSONBigInt.stringify(tx));
      if (!data) {
        this.logger.info(
          `Event [${eventId}] is not valid, failed to extract rosen data from lock transaction`
        );
        return false;
      }
      if (
        event.fromChain == CARDANO_CHAIN &&
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
          const clampedBridgeFee =
            BigInt(event.bridgeFee) > feeConfig.bridgeFee
              ? BigInt(event.bridgeFee)
              : feeConfig.bridgeFee;
          const calculatedRatioDivisorFee =
            (eventAmount * feeConfig.feeRatio) / this.feeRatioDivisor;
          const bridgeFee =
            clampedBridgeFee > calculatedRatioDivisorFee
              ? clampedBridgeFee
              : calculatedRatioDivisorFee;
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
   * verifies transaction fee for a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  verifyTransactionFee = (transaction: PaymentTransaction): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes);
    if (
      tx.body().fee().compare(CardanoUtils.bigIntToBigNum(this.configs.fee)) > 0
    ) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Transaction fee [${tx
          .body()
          .fee()
          .to_str()}] is more than maximum allowed fee [${this.configs.fee.toString()}]`
      );
      return false;
    }
    return true;
  };

  /**
   * verifies PaymentTransaction extra conditions like metadata and change box address
   * @param transaction to verify
   * @returns true if all conditions are met
   */
  verifyExtraCondition = (transaction: PaymentTransaction): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes);

    // check metadata
    if (tx.auxiliary_data()) {
      this.logger.debug(`Tx [${transaction.txId}] invalid: Contains metadata`);
      return false;
    }

    // check change box
    const changeBoxIndex = tx.body().outputs().len() - 1;
    const changeBox = tx.body().outputs().get(changeBoxIndex);
    if (changeBox.address().to_bech32() !== this.configs.addresses.lock) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Change box address is wrong`
      );
      return false;
    }

    return true;
  };

  /**
   * extracts confirmation status for a transaction
   * @param transactionId the transaction id
   * @param transactionType type of the transaction
   * @returns the transaction confirmation status
   */
  getTxConfirmationStatus = async (
    transactionId: string,
    transactionType: TransactionType
  ): Promise<ConfirmationStatus> => {
    const requiredConfirmation =
      this.getTxRequiredConfirmation(transactionType);
    const confirmation = await this.network.getTxConfirmation(transactionId);
    if (confirmation >= requiredConfirmation)
      return ConfirmationStatus.ConfirmedEnough;
    else if (confirmation === -1) return ConfirmationStatus.NotFound;
    else return ConfirmationStatus.NotConfirmedEnough;
  };

  /**
   * gets the minimum amount of native token for assetTransfer
   * @returns the minimum amount
   */
  getMinimumNativeToken = () => {
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
   * @param txs list of transactions
   * @param address the address
   * @param tokenId the token id
   * @returns a Map from input box id to output box
   */
  protected getTransactionsBoxMapping = (
    txs: CardanoWasm.Transaction[],
    address: string,
    tokenId?: string
  ): Map<string, CardanoUtxo | undefined> => {
    const trackMap = new Map<string, CardanoUtxo | undefined>();

    txs.forEach((tx) => {
      const txBody = tx.body();
      // iterate over tx inputs
      for (let i = 0; i < txBody.inputs().len(); i++) {
        let trackedBox: CardanoWasm.TransactionOutput | undefined;
        // iterate over tx outputs
        let index = 0;
        for (index = 0; index < txBody.outputs().len(); index++) {
          const output = txBody.outputs().get(index);
          // check if box satisfy conditions
          if (output.address().to_bech32() !== address) continue;
          if (tokenId) {
            const boxTokens = cardanoUtils.getBoxAssets(output).tokens;
            if (!boxTokens.find((token) => token.id === tokenId)) continue;
          }

          // mark the tracked box
          trackedBox = output;
          break;
        }

        // add input box to trackMap
        const input = txBody.inputs().get(i);
        const boxId = CardanoUtils.getBoxId(input);
        if (trackedBox) {
          const boxMultiAsset = trackedBox.amount().multiasset();
          const boxAssets: Array<CardanoAsset> = [];
          if (boxMultiAsset) {
            for (let k = 0; k < boxMultiAsset.keys().len(); k++) {
              const scriptHash = boxMultiAsset.keys().get(k);
              const asset = boxMultiAsset.get(scriptHash)!;
              for (let j = 0; j < asset.keys().len(); j++) {
                const assetName = asset.keys().get(j);
                const assetAmount = asset.get(assetName)!;
                const fingerprint = cardanoUtils.createFingerprint(
                  scriptHash,
                  assetName
                );
                boxAssets.push({
                  fingerprint: fingerprint,
                  policy_id: scriptHash.to_hex(),
                  asset_name: assetName.to_hex(),
                  quantity: BigInt(assetAmount.to_str()),
                });
              }
            }
          }
          const cardanoBox: CardanoUtxo = {
            txId: CardanoWasm.hash_transaction(txBody).to_hex(),
            index: index,
            value: BigInt(trackedBox.amount().coin().to_str()),
            assets: boxAssets,
          };
          trackMap.set(boxId, cardanoBox);
        } else {
          trackMap.set(boxId, undefined);
        }
      }
    });

    return trackMap;
  };

  /**
   * builds a signed transaction from transaction body and signature
   * @param txBody body of unsigned transaction
   * @param signature generated signature by signer service
   * @returns a signed transaction (in CardanoWasm format)
   */
  protected buildSignedTransaction = (
    txBody: CardanoWasm.TransactionBody,
    signature: string
  ): CardanoWasm.Transaction => {
    const vKeyWitness = CardanoWasm.Vkeywitness.from_bytes(
      Buffer.from(
        `825820${this.configs.aggregatedPublicKey}5840${signature}`,
        'hex'
      )
    );
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    vkeyWitnesses.add(vKeyWitness);
    const witnesses = CardanoWasm.TransactionWitnessSet.new();
    witnesses.set_vkeys(vkeyWitnesses);
    return CardanoWasm.Transaction.new(txBody, witnesses);
  };

  /**
   * converts json representation of the payment transaction to CardanoTransaction
   * @returns CardanoTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): CardanoTransaction =>
    CardanoTransaction.fromJson(jsonString);
}

export default CardanoChain;
