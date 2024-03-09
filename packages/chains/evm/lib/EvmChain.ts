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
  AssetBalance,
  SinglePayment,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractEvmNetwork from './network/AbstractEvmNetwork';
import { EvmConfigs } from './types';
import { Transaction, Contract } from 'ethers';

class EvmChain extends AbstractChain {
  declare network: AbstractEvmNetwork;
  declare configs: EvmConfigs;
  constructor(network: AbstractEvmNetwork, configs: any, logger?: any) {
    super(network, configs, logger);
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
    // Check the number of parallel transaction won't be exceeded
    const waiting =
      unsignedTransactions.length + serializedSignedTransactions.length;
    if (waiting >= this.configs.maxParallelTx) {
      throw new MaxParallelTxError(`
      There are ${waiting}transactions already in the process!`);
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
    const requiredAssets = ChainUtils.sumAssetBalance(order[0].assets, {
      nativeToken: gasRequired * gasPrice,
      tokens: [],
    });
    if (!(await this.hasLockAddressEnoughAssets(requiredAssets))) {
      const neededADA = requiredAssets.nativeToken.toString();
      const neededTokens = JSONBigInt.stringify(requiredAssets.tokens);
      throw new NotEnoughAssetsError(
        `Locked assets cannot cover required assets. ETH: ${neededADA}, Tokens: ${neededTokens}`
      );
    }

    // let trx
    // const nonce = await this.network.getAddressNextNonce(this.configs.addresses.lock)
    // let maxPriorityFeePerGas = await this.network.getMaxPriorityFeePerGas()
    // const contract = new Contract(contractAddress, contractAbi, provider);

    // Recipient address and amount to transfer
    // const toAddress = '';
    // const amount = 1; // replace with the amount you want to transfer

    // const data = contract.interface.encodeFunctionData('transfer', [toAddress, amount]);
    // if (order[0].assets.nativeToken != BigInt(0)) {
    //   trx = Transaction.from({
    //     to: order[0].address,
    //     nonce: nonce,
    //     gasLimit: gasRequired,
    //     maxPriorityFeePerGas: maxPriorityFeePerGas,
    //     maxFeePerGas: gasPrice,
    //     data: null,
    //     value: order[0].assets.nativeToken,
    //     chainId: this.configs.chainId,
    //   })
    // } else {
    //   trx = Transaction.from({
    //     to: order[0].address,
    //     nonce: nonce,
    //     gasLimit: gasRequired,
    //     maxPriorityFeePerGas: maxPriorityFeePerGas,
    //     maxFeePerGas: gasPrice,
    //     data: null,
    //     value: order[0].assets.nativeToken,
    //     chainId: this.configs.chainId,
    //   })
    // }
    throw Error('Not implemented yet!');
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
    throw new Error('Not implemented yet.');
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    throw new Error('Not implemented yet.');
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
    throw new Error('Not implemented yet.');
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
  getMinimumNativeToken = (): bigint => {
    throw new Error('Not implemented yet.');
  };

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @param jsonString the payment transaction's json representation
   * @returns PaymentTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): PaymentTransaction => {
    throw new Error('Not implemented yet.');
  };

  /**
   * generates PaymentTransaction object from raw tx json string
   * @param rawTxJsonString
   * @returns PaymentTransaction object
   */
  rawTxToPaymentTransaction = async (
    rawTxJsonString: string
  ): Promise<PaymentTransaction> => {
    throw new Error('Not implemented yet.');
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
