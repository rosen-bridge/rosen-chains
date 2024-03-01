import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { Fee } from '@rosen-bridge/minimum-fee';
import {
  AbstractUtxoChain,
  BoxInfo,
  ChainUtils,
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
import AbstractBitcoinNetwork from './network/AbstractBitcoinNetwork';
import BitcoinTransaction from './BitcoinTransaction';
import { BitcoinConfigs, BitcoinUtxo } from './types';
import Serializer from './Serializer';
import { Psbt, Transaction, address, payments, script } from 'bitcoinjs-lib';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { estimateTxFee, getPsbtTxInputBoxId } from './bitcoinUtils';
import { BITCOIN_CHAIN, SEGWIT_INPUT_WEIGHT_UNIT } from './constants';
import { blake2b } from 'blakejs';

class BitcoinChain extends AbstractUtxoChain<BitcoinUtxo> {
  declare network: AbstractBitcoinNetwork;
  declare configs: BitcoinConfigs;
  feeRatioDivisor: bigint;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;
  protected lockScript: string;
  protected signingScript: Buffer;

  constructor(
    network: AbstractBitcoinNetwork,
    configs: BitcoinConfigs,
    feeRatioDivisor: bigint,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
    this.feeRatioDivisor = feeRatioDivisor;
    this.signFunction = signFunction;
    this.lockScript = address
      .toOutputScript(this.configs.addresses.lock)
      .toString('hex');
    this.signingScript = payments.p2pkh({
      hash: Buffer.from(this.lockScript, 'hex').subarray(2),
    }).output!;
  }

  /**
   * generates unsigned PaymentTransaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @param unsignedTransactions ongoing unsigned PaymentTransactions (used for preventing double spend)
   * @param serializedSignedTransactions the serialized string of ongoing signed transactions (used for chaining transaction)
   * @returns the generated PaymentTransaction
   */
  generateTransaction = async (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[],
    ...extra: Array<any>
  ): Promise<BitcoinTransaction> => {
    this.logger.debug(
      `Generating Bitcoin transaction for Order: ${JsonBigInt.stringify(order)}`
    );
    // calculate required assets
    const requiredAssets = order
      .map((order) => order.assets)
      .reduce(ChainUtils.sumAssetBalance, {
        nativeToken: await this.minimumMeaningfulSatoshi(),
        tokens: [],
      });
    this.logger.debug(
      `Required assets: ${JsonBigInt.stringify(requiredAssets)}`
    );

    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededBtc = requiredAssets.nativeToken.toString();
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. BTC: ${neededBtc}`
      );
    }

    const forbiddenBoxIds = unsignedTransactions.flatMap((paymentTx) => {
      const inputs = Serializer.deserialize(paymentTx.txBytes).txInputs;
      const ids: string[] = [];
      for (let i = 0; i < inputs.length; i++)
        ids.push(getPsbtTxInputBoxId(inputs[i]));

      return ids;
    });
    const trackMap = this.getTransactionsBoxMapping(
      serializedSignedTransactions.map((serializedTx) =>
        Psbt.fromHex(serializedTx)
      ),
      this.configs.addresses.lock
    );

    // TODO: improve box fetching (use bitcoin-box-selection package)
    //  local:ergo/rosen-bridge/rosen-chains#90
    const coveredBoxes = await this.getCoveringBoxes(
      this.configs.addresses.lock,
      requiredAssets,
      forbiddenBoxIds,
      trackMap
    );
    if (!coveredBoxes.covered) {
      const neededBtc = requiredAssets.nativeToken.toString();
      throw new NotEnoughValidBoxesError(
        `Available boxes didn't cover required assets. BTC: ${neededBtc}`
      );
    }

    // add inputs
    const psbt = new Psbt();
    coveredBoxes.boxes.forEach((box) => {
      psbt.addInput({
        hash: box.txId,
        index: box.index,
        witnessUtxo: {
          script: Buffer.from(this.lockScript, 'hex'),
          value: Number(box.value),
        },
      });
    });
    // calculate input boxes assets
    let remainingBtc = coveredBoxes.boxes.reduce((a, b) => a + b.value, 0n);
    this.logger.debug(`Input BTC: ${remainingBtc}`);

    // add outputs
    order.forEach((order) => {
      if (order.extra) {
        throw Error('Bitcoin does not support extra data in payment order');
      }
      if (order.assets.tokens.length) {
        throw Error('Bitcoin does not support tokens in payment order');
      }
      if (order.address.slice(0, 4) !== 'bc1q') {
        throw Error('Bitcoin does not support payment to non-segwit addresses');
      }

      // reduce order value from remaining assets
      remainingBtc -= order.assets.nativeToken;

      // create order output
      psbt.addOutput({
        script: address.toOutputScript(order.address),
        value: Number(order.assets.nativeToken),
      });
    });

    // create change output
    this.logger.debug(`Remaining BTC: ${remainingBtc}`);
    const estimatedFee = estimateTxFee(
      psbt.txInputs.length,
      psbt.txOutputs.length + 1,
      await this.network.getFeeRatio()
    );
    this.logger.debug(`Estimated Fee: ${estimatedFee}`);
    remainingBtc -= estimatedFee;
    psbt.addOutput({
      script: Buffer.from(this.lockScript, 'hex'),
      value: Number(remainingBtc),
    });

    // create the transaction
    const txId = Transaction.fromBuffer(psbt.data.getTransaction()).getId();
    const txBytes = Serializer.serialize(psbt);

    const bitcoinTx = new BitcoinTransaction(
      txId,
      eventId,
      txBytes,
      txType,
      coveredBoxes.boxes.map((box) => JsonBigInt.stringify(box))
    );

    this.logger.info(
      `Bitcoin transaction [${txId}] as type [${txType}] generated for event [${eventId}]`
    );
    return bitcoinTx;
  };

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  getTransactionAssets = async (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    const bitcoinTx = transaction as BitcoinTransaction;

    let txBtc = 0n;
    const inputUtxos = Array.from(new Set(bitcoinTx.inputUtxos));
    for (let i = 0; i < inputUtxos.length; i++) {
      const input = JsonBigInt.parse(inputUtxos[i]) as BitcoinUtxo;
      txBtc += input.value;
    }

    // no need to calculate outBtc, because: inBtc = outBtc + fee
    return {
      inputAssets: {
        nativeToken: txBtc,
        tokens: [],
      },
      outputAssets: {
        nativeToken: txBtc,
        tokens: [],
      },
    };
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    const tx = Serializer.deserialize(transaction.txBytes);

    const order: PaymentOrder = [];
    for (let i = 0; i < tx.txOutputs.length; i++) {
      const output = tx.txOutputs[i];

      // skip change box (last box & address equal to bank address)
      if (
        i === tx.txOutputs.length - 1 &&
        output.script.toString('hex') === this.lockScript
      )
        continue;

      const payment: SinglePayment = {
        address: address.fromOutputScript(output.script),
        assets: {
          nativeToken: BigInt(output.value),
          tokens: [],
        },
      };
      order.push(payment);
    }
    return order;
  };

  /**
   * verifies transaction fee for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  verifyTransactionFee = async (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    const bitcoinTx = transaction as BitcoinTransaction;

    let inBtc = 0n;
    const inputUtxos = Array.from(new Set(bitcoinTx.inputUtxos));
    for (let i = 0; i < inputUtxos.length; i++) {
      const input = JsonBigInt.parse(inputUtxos[i]) as BitcoinUtxo;
      inBtc += input.value;
    }

    let outBtc = 0n;
    for (let i = 0; i < tx.txOutputs.length; i++) {
      const output = tx.txOutputs[i];
      outBtc += BigInt(output.value);
    }

    const fee = inBtc - outBtc;
    const estimatedFee = estimateTxFee(
      tx.txInputs.length,
      tx.txOutputs.length,
      await this.network.getFeeRatio()
    );

    const feeDifferencePercent = Math.abs(
      (Number(fee - estimatedFee) * 100) / Number(fee)
    );
    if (feeDifferencePercent > this.configs.txFeeSlippage) {
      this.logger.warn(
        `Fee difference is high. Slippage is higher than allowed value [${feeDifferencePercent} > ${this.configs.txFeeSlippage}]. fee: ${fee}, estimated fee: ${estimatedFee}`
      );
      return false;
    }
    return true;
  };

  /**
   * verifies no token burned in a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if no token burned
   */
  verifyNoTokenBurned = async (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    // Bitcoin has no token and BTC cannot be burned
    return true;
  };

  /**
   * verifies additional conditions for a BitcoinTransaction
   * - check change box
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    const tx = Serializer.deserialize(transaction.txBytes);

    // check change box
    const changeBoxIndex = tx.txOutputs.length - 1;
    const changeBox = tx.txOutputs[changeBoxIndex];
    if (changeBox.script.toString('hex') !== this.lockScript) {
      this.logger.debug(
        `Tx [${transaction.txId}] invalid: Change box address is wrong`
      );
      return false;
    }

    return true;
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event is verified
   */
  verifyEvent = async (
    event: EventTrigger,
    feeConfig: Fee
  ): Promise<boolean> => {
    const eventId = Buffer.from(
      blake2b(event.sourceTxId, undefined, 32)
    ).toString('hex');
    const baseError = `Event [${eventId}] is not valid, `;

    try {
      const blockTxs = await this.network.getBlockTransactionIds(
        event.sourceBlockId
      );
      if (!blockTxs.includes(event.sourceTxId)) {
        this.logger.info(
          baseError +
            `block [${event.sourceBlockId}] does not contain tx [${event.sourceTxId}]`
        );
        return false;
      }
      const tx = await this.network.getTransaction(
        event.sourceTxId,
        event.sourceBlockId
      );
      const blockHeight = (await this.network.getBlockInfo(event.sourceBlockId))
        .height;
      const data = this.network.extractor.get(JsonBigInt.stringify(tx));
      if (!data) {
        this.logger.info(
          baseError + `failed to extract rosen data from lock transaction`
        );
        return false;
      }
      if (
        event.fromChain === BITCOIN_CHAIN &&
        event.toChain === data.toChain &&
        event.networkFee === data.networkFee &&
        event.bridgeFee === data.bridgeFee &&
        event.amount === data.amount &&
        event.sourceChainTokenId === data.sourceChainTokenId &&
        event.targetChainTokenId === data.targetChainTokenId &&
        event.toAddress === data.toAddress &&
        event.fromAddress === data.fromAddress &&
        event.sourceChainHeight === blockHeight
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
              baseError +
                `event amount [${eventAmount}] is less than sum of bridgeFee [${bridgeFee}] and networkFee [${networkFee}]`
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
          baseError +
            `event data does not match with lock tx [${event.sourceTxId}]`
        );
        return false;
      }
    } catch (e) {
      if (e instanceof NotFoundError) {
        this.logger.info(
          baseError +
            `lock tx [${event.sourceTxId}] is not available in network`
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
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = async (
    transaction: PaymentTransaction,
    signingStatus: SigningStatus = SigningStatus.Signed
  ): Promise<boolean> => {
    const tx = Serializer.deserialize(transaction.txBytes);
    for (let i = 0; i < tx.txInputs.length; i++) {
      const boxId = getPsbtTxInputBoxId(tx.txInputs[i]);
      if (!(await this.network.isBoxUnspentAndValid(boxId))) {
        this.logger.debug(
          `Tx [${transaction.txId}] is invalid due to spending invalid input box [${boxId}] at index [${i}]`
        );
        return false;
      }
    }
    return true;
  };

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @returns the signed transaction
   */
  signTransaction = (
    transaction: PaymentTransaction,
    requiredSign: number
  ): Promise<PaymentTransaction> => {
    const psbt = Serializer.deserialize(transaction.txBytes);
    const tx = Transaction.fromBuffer(psbt.data.getTransaction());
    const bitcoinTx = transaction as BitcoinTransaction;

    const signaturePromises: Promise<string>[] = [];
    for (let i = 0; i < bitcoinTx.inputUtxos.length; i++) {
      const input = JsonBigInt.parse(bitcoinTx.inputUtxos[i]) as BitcoinUtxo;
      const signMessage = tx.hashForWitnessV0(
        i,
        this.signingScript,
        Number(input.value),
        Transaction.SIGHASH_ALL
      );

      const signatureHex = this.signFunction(signMessage).then(
        (signatureHex: string) => {
          this.logger.debug(
            `Input [${i}] of tx [${bitcoinTx.txId}] is signed. signature: ${signatureHex}`
          );
          return signatureHex;
        }
      );
      signaturePromises.push(signatureHex);
    }

    return Promise.all(signaturePromises).then((signatures) => {
      const signedPsbt = this.buildSignedTransaction(
        bitcoinTx.txBytes,
        signatures
      );
      // check if transaction can be finalized
      signedPsbt.finalizeAllInputs().extractTransaction();

      // generate PaymentTransaction with signed Psbt
      return new BitcoinTransaction(
        bitcoinTx.txId,
        bitcoinTx.eventId,
        Serializer.serialize(signedPsbt),
        bitcoinTx.txType,
        bitcoinTx.inputUtxos
      );
    });
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
        `Bitcoin Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting Bitcoin transaction [${transaction.txId}]: ${e}`
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
    return (await this.network.getMempoolTxIds()).includes(transactionId);
  };

  /**
   * gets the minimum amount of native token for transferring asset
   * @returns the minimum amount
   */
  getMinimumNativeToken = (): bigint => {
    // there is no token in bitcoin
    return 0n;
  };

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @returns PaymentTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): BitcoinTransaction =>
    BitcoinTransaction.fromJson(jsonString);

  /**
   * generates PaymentTransaction object from psbt hex string
   * @param psbtHex
   * @returns PaymentTransaction object
   */
  rawTxToPaymentTransaction = async (
    psbtHex: string
  ): Promise<PaymentTransaction> => {
    const tx = Psbt.fromHex(psbtHex);
    const txBytes = Serializer.serialize(tx);
    const txId = Transaction.fromBuffer(tx.data.getTransaction()).getId();

    const inputBoxes: Array<BitcoinUtxo> = [];
    const inputs = tx.txInputs;
    for (let i = 0; i < inputs.length; i++) {
      const boxId = getPsbtTxInputBoxId(inputs[i]);
      inputBoxes.push(await this.network.getUtxo(boxId));
    }

    const bitcoinTx = new BitcoinTransaction(
      txId,
      '',
      txBytes,
      TransactionType.manual,
      inputBoxes.map((box) => JsonBigInt.stringify(box))
    );

    this.logger.info(`Parsed Bitcoin transaction [${txId}] successfully`);
    return bitcoinTx;
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
  ): Promise<Map<string, BitcoinUtxo | undefined>> => {
    // chaining transaction won't be done in BitcoinChain
    // due to heavy size of transactions in mempool
    return new Map<string, BitcoinUtxo | undefined>();
  };

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  getBoxInfo = (box: BitcoinUtxo): BoxInfo => {
    return {
      id: this.getBoxId(box),
      assets: {
        nativeToken: box.value,
        tokens: [],
      },
    };
  };

  /**
   * generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
   * @param txs list of transactions
   * @param address the address
   * @returns a Map from input box id to output box
   */
  protected getTransactionsBoxMapping = (
    txs: Psbt[],
    address: string
  ): Map<string, BitcoinUtxo | undefined> => {
    const trackMap = new Map<string, BitcoinUtxo | undefined>();

    txs.forEach((tx) => {
      const txId = Transaction.fromBuffer(tx.data.getTransaction()).getId();
      // iterate over tx inputs
      tx.txInputs.forEach((input) => {
        let trackedBox: BitcoinUtxo | undefined = undefined;
        // iterate over tx outputs
        let index = 0;
        for (index = 0; index < tx.txOutputs.length; index++) {
          const output = tx.txOutputs[index];
          // check if box satisfy conditions
          if (output.address !== address) continue;

          // mark the tracked box
          trackedBox = {
            txId: txId,
            index: index,
            value: BigInt(output.value),
          };
          break;
        }

        // add input box to trackMap
        const boxId = getPsbtTxInputBoxId(input);
        trackMap.set(boxId, trackedBox);
      });
    });

    return trackMap;
  };

  /**
   * returns box id
   * @param box
   */
  protected getBoxId = (box: BitcoinUtxo): string => box.txId + '.' + box.index;

  /**
   * inserts signatures into psbt
   * @param txBytes
   * @param signatures generated signature by signer service
   * @returns a signed transaction (in Psbt format)
   */
  protected buildSignedTransaction = (
    txBytes: Uint8Array,
    signatures: string[]
  ): Psbt => {
    const psbt = Serializer.deserialize(txBytes);
    for (let i = 0; i < signatures.length; i++) {
      const signature = Buffer.from(signatures[i], 'hex');
      psbt.updateInput(i, {
        partialSig: [
          {
            pubkey: Buffer.from(this.configs.aggregatedPublicKey, 'hex'),
            signature: script.signature.encode(signature, 1),
          },
        ],
      });
    }
    return psbt;
  };

  /**
   * gets the minimum amount of satoshi for a utxo that can cover
   * additional fee for adding it to a tx
   * @returns the minimum amount
   */
  minimumMeaningfulSatoshi = async (): Promise<bigint> => {
    const currentFeeRatio = await this.network.getFeeRatio();
    return BigInt(
      Math.ceil(
        (currentFeeRatio * SEGWIT_INPUT_WEIGHT_UNIT) / 4 // estimate fee per weight and convert to virtual size
      )
    );
  };
}

export default BitcoinChain;
