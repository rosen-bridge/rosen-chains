import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AbstractUtxoChain,
  AssetBalance,
  BlockInfo,
  BoxInfo,
  ChainUtils,
  CoveringBoxes,
  GET_BOX_API_LIMIT,
  NotEnoughAssetsError,
  NotEnoughValidBoxesError,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  SinglePayment,
  TransactionAssetBalance,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import AbstractBitcoinNetwork from './network/AbstractBitcoinNetwork';
import BitcoinTransaction from './BitcoinTransaction';
import {
  BitcoinConfigs,
  BitcoinTx,
  BitcoinUtxo,
  TssSignFunction,
} from './types';
import Serializer from './Serializer';
import { Psbt, Transaction, address, payments, script } from 'bitcoinjs-lib';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { estimateTxFee, getPsbtTxInputBoxId } from './bitcoinUtils';
import { BITCOIN_CHAIN, SEGWIT_INPUT_WEIGHT_UNIT } from './constants';
import { selectBitcoinUtxos } from '@rosen-bridge/bitcoin-utxo-selection';
import { BitcoinRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { RosenTokens } from '@rosen-bridge/tokens';

class BitcoinChain extends AbstractUtxoChain<BitcoinTx, BitcoinUtxo> {
  declare network: AbstractBitcoinNetwork;
  declare configs: BitcoinConfigs;
  CHAIN = BITCOIN_CHAIN;
  extractor: BitcoinRosenExtractor;
  protected signFunction: TssSignFunction;
  protected lockScript: string;
  protected signingScript: Buffer;

  constructor(
    network: AbstractBitcoinNetwork,
    configs: BitcoinConfigs,
    tokens: RosenTokens,
    signFunction: TssSignFunction,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
    this.extractor = new BitcoinRosenExtractor(
      configs.addresses.lock,
      tokens,
      logger
    );
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
  generateMultipleTransactions = async (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[]
  ): Promise<BitcoinTransaction[]> => {
    this.logger.debug(
      `Generating Bitcoin transaction for Order: ${JsonBigInt.stringify(order)}`
    );
    const feeRatio = await this.network.getFeeRatio();

    // calculate required assets
    const requiredAssets = order
      .map((order) => order.assets)
      .reduce(ChainUtils.sumAssetBalance, {
        nativeToken: this.minimumMeaningfulSatoshi(feeRatio),
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

    // fetch input boxes
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
      feeRatio
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
    return [bitcoinTx];
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
   * verifies additional conditions for a event lock transaction
   * @param transaction the lock transaction
   * @param blockInfo
   * @returns true if the transaction is verified
   */
  verifyLockTransactionExtraConditions = (
    transaction: BitcoinTx,
    blockInfo: BlockInfo
  ): boolean => {
    return true;
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

      const signatureHex = this.signFunction(signMessage).then((response) => {
        this.logger.debug(
          `Input [${i}] of tx [${bitcoinTx.txId}] is signed. signature: ${response.signature}`
        );
        return response.signature;
      });
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
  minimumMeaningfulSatoshi = (feeRatio: number): bigint => {
    return BigInt(
      Math.ceil(
        (feeRatio * SEGWIT_INPUT_WEIGHT_UNIT) / 4 // estimate fee per weight and convert to virtual size
      )
    );
  };

  /**
   * gets useful, allowable and last boxes for an address until required assets are satisfied
   * @param address the address
   * @param requiredAssets the required assets
   * @param forbiddenBoxIds the id of forbidden boxes
   * @param trackMap the mapping of a box id to it's next box
   * @returns an object containing the selected boxes with a boolean showing if requirements covered or not
   */
  getCoveringBoxes = async (
    address: string,
    requiredAssets: AssetBalance,
    forbiddenBoxIds: Array<string>,
    trackMap: Map<string, BitcoinUtxo | undefined>
  ): Promise<CoveringBoxes<BitcoinUtxo>> => {
    const getAddressBoxes = this.network.getAddressBoxes;
    async function* generator() {
      let offset = 0;
      const limit = GET_BOX_API_LIMIT;
      while (true) {
        const page = await getAddressBoxes(address, offset, limit);
        if (page.length === 0) break;
        yield* page;
        offset += limit;
      }
      return undefined;
    }
    const utxoIterator = generator();

    // estimate tx weight without considering inputs
    //  0 inputs, 2 outputs, 1 for feeRatio to get weights only, multiply by 4 to convert vSize to weight unit
    const estimatedTxWeight = Number(estimateTxFee(0, 2, 1)) * 4;

    const feeRatio = await this.network.getFeeRatio();
    return selectBitcoinUtxos(
      requiredAssets.nativeToken,
      forbiddenBoxIds,
      trackMap,
      utxoIterator,
      this.minimumMeaningfulSatoshi(feeRatio),
      SEGWIT_INPUT_WEIGHT_UNIT,
      estimatedTxWeight,
      feeRatio,
      this.logger
    );
  };

  /**
   * serializes the transaction of this chain into string
   */
  protected serializeTx = (tx: BitcoinTx): string => JsonBigInt.stringify(tx);
}

export default BitcoinChain;
