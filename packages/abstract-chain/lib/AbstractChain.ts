import AbstractChainNetwork from './network/AbstractChainNetwork';
import {
  AssetBalance,
  ConfirmationStatus,
  EventTriggerModel,
  PaymentTransactionModel,
} from './types';
import { Fee } from '@rosen-bridge/minimum-fee';

abstract class AbstractChain {
  protected network: AbstractChainNetwork;

  constructor(network: AbstractChainNetwork) {
    this.network = network;
  }

  /**
   * generates unsigned payment transaction of the event using lock address
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns the generated payment transaction
   */
  abstract generatePaymentTransaction: (
    event: EventTriggerModel,
    feeConfig: Fee
  ) => Promise<PaymentTransactionModel>;

  /**
   * generates unsigned transaction to transfer assets to cold storage
   * @param transferringAssets an object containing the amount of each asset to transfer
   * @returns the generated asset transfer transaction
   */
  abstract generateColdStorageTransaction: (
    transferringAssets: AssetBalance
  ) => Promise<PaymentTransactionModel>;

  /**
   * verifies a payment transaction for an event
   * @param transaction the payment transaction
   * @param event the event trigger model
   * @param feeConfig minimum fee and rsn ratio config for the event
   * @returns true if the transaction verified
   */
  abstract verifyPaymentTransaction: (
    transaction: PaymentTransactionModel,
    event: EventTriggerModel,
    feeConfig: Fee
  ) => Promise<boolean>;

  /**
   * verifies an asset transfer transaction
   * @param transaction the asset transfer transaction
   * @returns true if the transaction verified
   */
  abstract verifyColdStorageTransaction: (
    transaction: PaymentTransactionModel
  ) => Promise<boolean>;

  /**
   * verifies an event data with its corresponding lock transaction
   * @param event the event trigger model
   * @param RwtId the RWT token id in the event trigger box
   * @returns true if the event verified
   */
  abstract verifyEvent: (
    event: EventTriggerModel,
    RwtId: string
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
   * @returns the signed transaction
   */
  abstract signTransaction: (
    transaction: PaymentTransactionModel
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
  abstract getHeight: () => Promise<number>;

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
}

export default AbstractChain;
