import AbstractChainNetwork from './network/AbstractChainNetwork';
import {
  AssetBalance,
  ChainConfigs,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  PaymentTransaction,
  TransactionAssetBalance,
} from './types';
import { Fee } from '@rosen-bridge/minimum-fee';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';
import ChainUtils from './ChainUtils';
import { ValueError } from './errors';

abstract class AbstractChain {
  protected network: AbstractChainNetwork;
  protected configs: ChainConfigs;
  logger: AbstractLogger;

  constructor(
    network: AbstractChainNetwork,
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
   * @param inputs the inputs for transaction
   * @returns the generated PaymentTransaction
   */
  abstract generateTransaction: (
    eventId: string,
    txType: string,
    order: PaymentOrder,
    ...extra: Array<any>
  ) => Promise<PaymentTransaction>;

  /**
   * gets input and output assets of a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns an object containing the amount of input and output assets
   */
  abstract getTransactionAssets: (
    transaction: PaymentTransaction
  ) => TransactionAssetBalance;

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
   * @returns true if the transaction fee verified
   */
  abstract verifyTransactionFee: (transaction: PaymentTransaction) => boolean;

  /**
   * verifies no token burned in a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if not token burned
   */
  verifyNoTokenBurned = (transaction: PaymentTransaction): boolean => {
    const assets = this.getTransactionAssets(transaction);
    return !ChainUtils.isEqualAssetBalance(
      assets.inputAssets,
      assets.outputAssets
    );
  };

  /**
   * verifies additional conditions for a PaymentTransaction
   * @param transaction the PaymentTransaction
   * @returns true if the transaction verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransaction
  ): boolean => {
    return true;
  };

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param RwtId the RWT token id in the event trigger box
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the event verified
   */
  abstract verifyEvent: (
    event: EventTrigger,
    RwtId: string,
    feeConfig: Fee
  ) => Promise<boolean>;

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @returns true if the transaction is still valid
   */
  abstract isTxValid: (transaction: PaymentTransaction) => Promise<boolean>;

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @param signFunction the function to sign transaction
   * @returns the signed transaction
   */
  abstract signTransaction: (
    transaction: PaymentTransaction,
    requiredSign: number,
    signFunction: (...arg: Array<any>) => any
  ) => Promise<PaymentTransaction>;

  /**
   * extracts confirmation status for a payment transaction
   * @param transactionId the PaymentTransaction id
   * @returns the transaction confirmation status
   */
  abstract getPaymentTxConfirmationStatus: (
    transactionId: string
  ) => Promise<ConfirmationStatus>;

  /**
   * extracts confirmation status for an asset transfer transaction
   * @param transactionId the asset transfer transaction id
   * @returns the transaction confirmation status
   */
  abstract getColdStorageTxConfirmationStatus: (
    transactionId: string
  ) => Promise<ConfirmationStatus>;

  /**
   * gets the amount of each asset in the lock address
   * @returns an object containing the amount of each asset
   */
  abstract getLockAddressAssets: () => Promise<AssetBalance>;

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
      ChainUtils.reduceAssetBalance(lockAssets, required);
    } catch (e) {
      if (e instanceof ValueError) {
        this.logger.warn(e.message);
        return false;
      } else throw e;
    }
    return true;
  };
}

export default AbstractChain;
