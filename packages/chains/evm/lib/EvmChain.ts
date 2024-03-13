import JSONBigInt from '@rosen-bridge/json-bigint';
import {
  AbstractChain,
  EventTrigger,
  MaxParallelTxError,
  OrderError,
  ChainUtils,
  NotEnoughAssetsError,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  TransactionAssetBalance,
  TransactionType,
  SinglePayment,
  PaymentTransactionJsonModel,
  AssetBalance,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractEvmNetwork from './network/AbstractEvmNetwork';
import { EvmConfigs } from './types';
import { Transaction, TransactionLike } from 'ethers';
import Serializer from './Serializer';
import EvmUtils from './EvmUtils';

abstract class EvmChain extends AbstractChain {
  declare network: AbstractEvmNetwork;
  declare configs: EvmConfigs;
  // TODO: fix 'CHAIN' vars
  abstract CHAIN: string;
  feeRatioDivisor: bigint;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    feeRatioDivisor: bigint,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: any
  ) {
    super(network, configs, logger);
    this.feeRatioDivisor = feeRatioDivisor;
    this.signFunction = signFunction;
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
    serializedSignedTransactions: string[]
  ): Promise<PaymentTransaction> => {
    // TODO later change this to return a transaction per SinglePayment
    order = [EvmUtils.splitPaymentOrders(order)[0]];
    // Check the number of parallel transaction won't be exceeded
    const waiting =
      unsignedTransactions.length + serializedSignedTransactions.length;
    if (waiting >= this.configs.maxParallelTx) {
      throw new MaxParallelTxError(`
      There are ${waiting} transactions already in the process!`);
    }

    // Chech the number of orders
    if (order.length != 1) {
      throw new OrderError(`
      Only one order is allowed, but ${order.length} are found!`);
    }
    if (
      order[0].assets.nativeToken != BigInt(0) &&
      order[0].assets.tokens.length > 0
    ) {
      throw new OrderError(`
      Both Native token and non-native assets are being transfered!`);
    }

    // Check the balance in the lock address
    const gasPrice = await this.network.getMaxFeePerGas();
    const gasRequired = this.getGasRequired(order[0]);
    const amount = gasRequired * gasPrice;
    const requiredAssets = ChainUtils.sumAssetBalance(order[0].assets, {
      nativeToken: amount,
      tokens: [],
    });
    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededETH = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. ETH: ${neededETH}, Tokens: ${neededTokens}`
      );
    }

    // Generate the transaction
    let trx;
    const nonce = await this.network.getAddressNextNonce(
      this.configs.addresses.lock
    );
    const maxPriorityFeePerGas = await this.network.getMaxPriorityFeePerGas();

    if (order[0].assets.nativeToken != BigInt(0)) {
      trx = Transaction.from({
        to: order[0].address,
        nonce: nonce,
        gasLimit: gasRequired,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: gasPrice,
        data: '0x' + eventId,
        value: order[0].assets.nativeToken,
        chainId: this.configs.chainId,
      });
    } else {
      const token = order[0].assets.tokens[0];
      const data = EvmUtils.generateTransferCallData(
        token.id,
        order[0].address,
        token.value
      );
      trx = Transaction.from({
        to: token.id,
        nonce: nonce,
        gasLimit: gasRequired,
        maxPriorityFeePerGas: maxPriorityFeePerGas,
        maxFeePerGas: gasPrice,
        data: data + eventId,
        value: BigInt(0),
        chainId: this.configs.chainId,
      } as TransactionLike);
    }
    const evmTx = new PaymentTransaction(
      this.CHAIN,
      trx.unsignedHash,
      eventId,
      Serializer.serialize(trx),
      txType
    );

    this.logger.info(
      `Cardano transaction [${trx.hash}] as type [${txType}] generated for event [${eventId}]`
    );
    return evmTx;
  };

  /**
   * gets gas required to do the transfer.
   * Note that we assume checks have been done before calling this function;
   * either nativeToken should be non zero, or there is only one asset in the tokens list.
   * @param payment the SinglePayment to be made
   * @returns gas required in bigint
   */
  getGasRequired = (payment: SinglePayment): bigint => {
    if (payment.assets.nativeToken != BigInt(0)) {
      return this.network.getGasRequiredNativeTransfer(payment.address);
    }
    return this.network.getGasRequiredERC20Transfer(
      payment.assets.tokens[0].id,
      payment.address,
      payment.assets.tokens[0].value
    );
  };

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  getTransactionAssets = async (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    const tx = Serializer.deserialize(transaction.txBytes);

    const outputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };
    const inputAssets: AssetBalance = {
      nativeToken: 0n,
      tokens: [],
    };

    const networkFee = tx.maxFeePerGas! * tx.gasLimit;
    outputAssets.nativeToken = tx.value + networkFee;
    inputAssets.nativeToken = tx.value + networkFee;

    if (tx.data.substring(2, 10) == 'a9059cbb') {
      outputAssets.tokens.push({
        id: tx.to!.toLowerCase(),
        value: BigInt('0x' + tx.data.slice(74, 72 + 66)),
      });
      inputAssets.tokens.push({
        id: tx.to!.toLowerCase(),
        value: BigInt('0x' + tx.data.slice(74, 72 + 66)),
      });
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
    const tx = Serializer.deserialize(transaction.txBytes);
    if (tx.value != BigInt(0)) {
      return [
        {
          address: tx.to!.toLowerCase(),
          assets: {
            nativeToken: tx.value,
            tokens: [],
          },
        },
      ];
    } else {
      return [
        {
          address: '0x' + tx.data.substring(34, 74),
          assets: {
            nativeToken: BigInt(0),
            tokens: [
              {
                id: tx.to!.toLowerCase(),
                value: BigInt('0x' + tx.data.substring(74, 138)),
              },
            ],
          },
        },
      ];
    }
  };

  /**
   * verifies transaction fee for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  verifyTransactionFee = (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    throw new Error('Not implemented yet.');
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
    throw new Error('Not implemented yet.');
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = async (
    transaction: PaymentTransaction,
    signingStatus: SigningStatus
  ): Promise<boolean> => {
    throw new Error('Not implemented yet.');
  };

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @returns the signed transaction
   */
  signTransaction = async (
    transaction: PaymentTransaction,
    requiredSign: number
  ): Promise<PaymentTransaction> => {
    throw new Error('Not implemented yet.');
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
        `${this.CHAIN} Transaction [${transaction.txId}] submitted. Response: ${response}`
      );
    } catch (e) {
      this.logger.warn(
        `An error occurred while submitting ${this.CHAIN} transaction [${transaction.txId}]: ${e}`
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
    throw new Error('Not implemented yet.');
  };

  /**
   * gets the minimum amount of native token for transferring asset
   * @returns the minimum amount
   */
  getMinimumNativeToken = (): bigint => 0n;

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @param jsonString the payment transaction's json representation
   * @returns PaymentTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): PaymentTransaction => {
    const obj = JSON.parse(jsonString) as PaymentTransactionJsonModel;
    return new PaymentTransaction(
      this.CHAIN,
      obj.txId,
      obj.eventId,
      Buffer.from(obj.txBytes, 'hex'),
      obj.txType as TransactionType
    );
  };

  /**
   * generates PaymentTransaction object from raw tx json string
   * @param rawTxJsonString
   * @returns PaymentTransaction object
   */
  rawTxToPaymentTransaction = async (
    rawTxJsonString: string
  ): Promise<PaymentTransaction> => {
    const trx = Transaction.from(JSON.parse(rawTxJsonString));
    const evmTx = new PaymentTransaction(
      this.CHAIN,
      trx.unsignedHash,
      '',
      Serializer.serialize(trx),
      TransactionType.manual
    );

    this.logger.info(
      `Parsed ${this.CHAIN} transaction [${trx.unsignedHash}] successfully`
    );
    return evmTx;
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    throw new Error('Not implemented yet.');
  };
}

export default EvmChain;
