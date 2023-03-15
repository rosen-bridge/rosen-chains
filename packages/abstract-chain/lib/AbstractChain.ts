import AbstractChainNetwork from './network/AbstractChainNetwork';
import {
  AssetBalance,
  ConfirmationStatus,
  EventTriggerModel,
  PaymentOrder,
  PaymentTransactionModel,
  TransactionAssetBalance,
} from './types';
import { Fee } from '@rosen-bridge/minimum-fee';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';
import { AbstractRosenDataExtractor } from '@rosen-bridge/rosen-extractor';
import ChainUtils from './ChainUtils';

abstract class AbstractChain {
  protected network: AbstractChainNetwork;
  protected abstract extractor: AbstractRosenDataExtractor<string>;
  logger: AbstractLogger;
  rsnRatioDivisor: bigint;

  constructor(
    network: AbstractChainNetwork,
    rsnRatioDivisor: bigint,
    logger?: AbstractLogger
  ) {
    this.network = network;
    this.logger = logger ? logger : new DummyLogger();
    this.rsnRatioDivisor = rsnRatioDivisor;
  }

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param order the payment order (list of single payments)
   * @param inputs the inputs for transaction
   * @returns the generated payment transaction
   */
  abstract generateTransaction: (
    eventId: string,
    order: PaymentOrder,
    ...extra: Array<any>
  ) => Promise<PaymentTransactionModel>;

  /**
   * gets input and output assets of a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  abstract getTransactionAssets: (
    transaction: PaymentTransactionModel
  ) => TransactionAssetBalance;

  /**
   * verifies transaction fee for a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  abstract verifyTransactionFee: (
    transaction: PaymentTransactionModel
  ) => boolean;

  /**
   * verifies no token burned in the payment transaction
   * @param transaction the payment transaction
   * @returns true if not token burned
   */
  verifyNoTokenBurned = (transaction: PaymentTransactionModel): boolean => {
    const assets = this.getTransactionAssets(transaction);
    return ChainUtils.isEqualAssetBalance(
      assets.inputAssets,
      assets.outputAssets
    );
  };

  /**
   * verifies additional conditions for a payment transaction
   * @param transaction the payment transaction
   * @returns true if the transaction verified
   */
  verifyTransactionExtraConditions = (
    transaction: PaymentTransactionModel
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
    event: EventTriggerModel,
    RwtId: string,
    feeConfig: Fee
  ) => Promise<boolean>;

  /**
   * checks if a transaction is still valid and can be sent to the network
   * @param transaction the transaction
   * @returns true if the transaction is still valid
   */
  abstract isTxValid: (
    transaction: PaymentTransactionModel
  ) => Promise<boolean>;

  /**
   * requests the corresponding signer service to sign the transaction
   * @param transaction the transaction
   * @param requiredSign the required number of sign
   * @param signFunction the function to sign transaction
   * @returns the signed transaction
   */
  abstract signTransaction: (
    transaction: PaymentTransactionModel,
    requiredSign: number,
    signFunction: (...arg: Array<any>) => any
  ) => Promise<PaymentTransactionModel>;

  /**
   * extracts confirmation status for a payment transaction
   * @param transactionId the payment transaction id
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
    transaction: PaymentTransactionModel
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
   * @returns an object containing the amount of each asset
   */
  hasLockAddressEnoughAssets = (
    required: AssetBalance
  ): Promise<AssetBalance> => {
    // TODO: implement this
    throw Error(`not implemented yet`);
  };
}

export default AbstractChain;
