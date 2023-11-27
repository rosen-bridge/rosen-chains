import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';
import { Fee } from '@rosen-bridge/minimum-fee';
import ChainUtils from './ChainUtils';
import { ValueError } from './errors';
import AbstractChainNetwork from './network/AbstractChainNetwork';
import {
  AssetBalance,
  ChainConfigs,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  SigningStatus,
  TransactionAssetBalance,
  TransactionType,
} from './types';
import PaymentTransaction from './PaymentTransaction';

abstract class AbstractChain {
  protected network: AbstractChainNetwork<unknown>;
  protected configs: ChainConfigs;
  logger: AbstractLogger;

  constructor(
    network: AbstractChainNetwork<unknown>,
    configs: ChainConfigs,
    logger?: AbstractLogger
  ) {
    this.network = network;
    this.configs = configs;
    this.logger = logger ? logger : new DummyLogger();
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
  abstract generateTransaction: (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[],
    ...extra: Array<any>
  ) => Promise<PaymentTransaction>;

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  abstract getTransactionAssets: (
    transaction: PaymentTransaction
  ) => Promise<TransactionAssetBalance>;

  /**
   * extracts payment order of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns the transaction payment order (list of single payments)
   */
  abstract extractTransactionOrder: (
    transaction: PaymentTransaction
  ) => PaymentOrder;

  /**
   * verifies transaction fee for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction fee is verified
   */
  abstract verifyTransactionFee: (transaction: PaymentTransaction) => boolean;

  /**
   * verifies no token burned in a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if no token burned
   */
  verifyNoTokenBurned = async (
    transaction: PaymentTransaction
  ): Promise<boolean> => {
    const assets = await this.getTransactionAssets(transaction);
    return ChainUtils.isEqualAssetBalance(
      assets.inputAssets,
      assets.outputAssets
    );
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction is verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    return true;
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event is verified
   */
  abstract verifyEvent: (
    event: EventTrigger,
    feeConfig: Fee
  ) => Promise<boolean>;

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @param signingStatus
   * @returns true if the transaction is still valid
   */
  abstract isTxValid: (
    transaction: PaymentTransaction,
    signingStatus: SigningStatus
  ) => Promise<boolean>;

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @returns the signed transaction
   */
  abstract signTransaction: (
    transaction: PaymentTransaction,
    requiredSign: number
  ) => Promise<PaymentTransaction>;

  /**
   * @param transactionType type of the transaction
   * @returns required number of confirmation
   */
  getTxRequiredConfirmation = (transactionType: TransactionType): number => {
    switch (transactionType) {
      case TransactionType.payment:
        return this.configs.confirmations.payment;
      case TransactionType.coldStorage:
        return this.configs.confirmations.cold;
      case TransactionType.lock:
        return this.configs.confirmations.observation;
      case TransactionType.manual:
        return this.configs.confirmations.manual;
      default:
        throw Error(
          `Confirmation for type [${transactionType}] is not defined in abstract chain`
        );
    }
  };

  /**
   * extracts confirmation status for a transaction
   * @param transactionId the transaction id
   * @param transactionType type of the transaction
   * @returns the transaction confirmation status
   */
  abstract getTxConfirmationStatus: (
    transactionId: string,
    transactionType: TransactionType
  ) => Promise<ConfirmationStatus>;

  /**
   * gets the amount of each asset in the address
   * @param address
   * @returns an object containing the amount of each asset
   */
  getAddressAssets = async (address: string): Promise<AssetBalance> =>
    await this.network.getAddressAssets(address);

  /**
   * gets the amount of each asset in the lock address
   * @returns an object containing the amount of each asset
   */
  getLockAddressAssets = async (): Promise<AssetBalance> =>
    await this.getAddressAssets(this.configs.addresses.lock);

  /**
   * gets the amount of each asset in the cold storage address
   * @returns an object containing the amount of each asset
   */
  getColdAddressAssets = async (): Promise<AssetBalance> =>
    await this.getAddressAssets(this.configs.addresses.cold);

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => await this.network.getHeight();

  /**
   * submits a transaction to the blockchain
   * @param transaction the transaction
   */
  abstract submitTransaction: (
    transaction: PaymentTransaction
  ) => Promise<void>;

  /**
   * checks if a transaction is in mempool (returns false if the chain has no mempool)
   * @param transactionId the transaction id
   * @returns true if the transaction is in mempool
   */
  abstract isTxInMempool: (transactionId: string) => Promise<boolean>;

  /**
   * checks if lock address assets are more than required assets or not
   * @param required required amount of assets
   * @returns true if lock assets are more than required assets
   */
  hasLockAddressEnoughAssets = async (
    required: AssetBalance
  ): Promise<boolean> => {
    const lockAssets = await this.getLockAddressAssets();
    try {
      ChainUtils.subtractAssetBalance(lockAssets, required);
    } catch (e) {
      if (e instanceof ValueError) {
        this.logger.warn(e.message);
        return false;
      } else throw e;
    }
    return true;
  };

  /**
   * gets the minimum amount of native token for transferring asset
   * @returns the minimum amount
   */
  abstract getMinimumNativeToken: () => bigint;

  /**
   * gets the RWT token id
   * @returns RWT token id
   */
  abstract getRWTToken: () => string;

  /**
   * converts json representation of the payment transaction to PaymentTransaction
   * @returns PaymentTransaction object
   */
  abstract PaymentTransactionFromJson: (
    jsonString: string
  ) => PaymentTransaction;

  /**
   * generates PaymentTransaction object from raw tx json string
   * @param rawTxJsonString
   * @returns PaymentTransaction object
   */
  abstract rawTxToPaymentTransaction: (
    rawTxJsonString: string
  ) => PaymentTransaction;

  /**
   * returns chain config
   * @assetId
   */
  getChainConfigs = (): ChainConfigs => this.configs;
}

export default AbstractChain;
