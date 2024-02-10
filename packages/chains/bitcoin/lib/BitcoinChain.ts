import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { Fee } from '@rosen-bridge/minimum-fee';
import {
  AbstractUtxoChain,
  BoxInfo,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  PaymentTransaction,
  SigningStatus,
  TransactionAssetBalance,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import AbstractBitcoinNetwork from './network/AbstractBitcoinNetwork';
import BitcoinTransaction from './BitcoinTransaction';
import { BitcoinConfigs, BitcoinUtxo } from './types';

class BitcoinChain extends AbstractUtxoChain<BitcoinUtxo> {
  declare network: AbstractBitcoinNetwork;
  declare configs: BitcoinConfigs;
  feeRatioDivisor: bigint;
  protected signFunction: (txHash: Uint8Array) => Promise<string>;

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
  generateTransaction = (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[],
    ...extra: Array<any>
  ): Promise<BitcoinTransaction> => {
    throw Error(`not implemented`);
  };

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  getTransactionAssets = (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    throw Error(`not implemented`);
  };

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    throw Error(`not implemented`);
  };

  /**
   * verifies transaction fee for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  verifyTransactionFee = (transaction: PaymentTransaction): boolean => {
    throw Error(`not implemented`);
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
   * verifies additional conditions for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    throw Error(`not implemented`);
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event is verified
   */
  verifyEvent = (event: EventTrigger, feeConfig: Fee): Promise<boolean> => {
    throw Error(`not implemented`);
  };

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  isTxValid = (
    transaction: PaymentTransaction,
    _signingStatus: SigningStatus = SigningStatus.Signed
  ): Promise<boolean> => {
    throw Error(`not implemented`);
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
    throw Error(`not implemented`);
  };

  /**
   * extracts confirmation status for a transaction
   * @param transactionId the transaction id
   * @param transactionType type of the transaction
   * @returns the transaction confirmation status
   */
  getTxConfirmationStatus = (
    transactionId: string,
    transactionType: TransactionType
  ): Promise<ConfirmationStatus> => {
    throw Error(`not implemented`);
  };

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  submitTransaction = (transaction: PaymentTransaction): Promise<void> => {
    throw Error(`not implemented`);
  };

  /**
   * checks if a transaction is in mempool (returns false if the chain has no mempool)
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  isTxInMempool = (transactionId: string): Promise<boolean> => {
    throw Error(`not implemented`);
  };

  /**
   * gets the minimum amount of native token for transferring asset
   * @returns the minimum amount
   */
  getMinimumNativeToken = (): bigint => this.configs.minBoxValue;

  /**
   * gets the RWT token id
   * @returns RWT token id
   */
  getRWTToken = (): string => this.configs.rwtId;

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @returns PaymentTransaction object
   */
  PaymentTransactionFromJson = (jsonString: string): PaymentTransaction => {
    throw Error(`not implemented`);
  };

  /**
   * generates PaymentTransaction object from raw tx json string
   * @param rawTxJsonString
   * @returns PaymentTransaction object
   */
  rawTxToPaymentTransaction = (
    rawTxJsonString: string
  ): Promise<PaymentTransaction> => {
    throw Error(`not implemented`);
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
    // due to heavy size of transaction in mempool
    return new Map<string, BitcoinUtxo | undefined>();
  };

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  protected getBoxInfo = (box: BitcoinUtxo): BoxInfo => {
    throw Error(`not implemented`);
  };
}

export default BitcoinChain;
