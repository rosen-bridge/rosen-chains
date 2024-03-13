import {
  AbstractChain,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  TransactionAssetBalance,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractEvmNetwork from './network/AbstractEvmNetwork';
class EvmChain extends AbstractChain {
  declare network: AbstractEvmNetwork;
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
    throw new Error('Not implemented yet.');
  };

  /**
   * generates single or multiple unsigned PaymentTransactions for a payment order
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
  ): Promise<PaymentTransaction[]> => {
    throw new Error('Not implemented yet.');
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
