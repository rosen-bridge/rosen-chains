import {
  AbstractUtxoChain,
  AssetBalance,
  BoxInfo,
  ConfirmationStatus,
  EventTrigger,
  PaymentOrder,
  PaymentTransaction,
  TransactionAssetBalance,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import AbstractCardanoNetwork from './network/AbstractCardanoNetwork';
import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { CardanoConfigs } from './types';
import { TransactionBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import { txBuilderConfig } from './constants';

class CardanoChain extends AbstractUtxoChain {
  declare network: AbstractCardanoNetwork;
  declare configs: CardanoConfigs;

  constructor(
    network: AbstractCardanoNetwork,
    configs: CardanoConfigs,
    logger?: AbstractLogger
  ) {
    super(network, configs, logger);
  }

  extractTransactionOrder = (transaction: PaymentTransaction): PaymentOrder => {
    return {} as any;
  };

  /**
   * generates unsigned payment transaction for payment order
   * @param eventId the id of event
   * @param txType transaction type
   * @param order the payment order (list of single payments)
   * @returns the generated payment transaction
   */
  generateTransaction = (
    eventId: string,
    txType: string,
    order: PaymentOrder
  ): Promise<PaymentTransaction> => {
    const txBuilder = TransactionBuilder.new(txBuilderConfig);

    return {} as any;
  };

  getBoxInfo = (serializedBox: string): BoxInfo => {
    return {} as any;
  };

  getColdStorageTxConfirmationStatus = (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    return {} as any;
  };

  getLockAddressAssets = (): Promise<AssetBalance> => {
    return {} as any;
  };

  getMempoolBoxMapping = (
    address: string,
    tokenId: string | undefined
  ): Promise<Map<string, string | undefined>> => {
    return {} as any;
  };

  getPaymentTxConfirmationStatus = (
    transactionId: string
  ): Promise<ConfirmationStatus> => {
    return {} as any;
  };

  getTransactionAssets = (
    transaction: PaymentTransaction
  ): TransactionAssetBalance => {
    return {} as any;
  };

  isTxInMempool = (transactionId: string): Promise<boolean> => {
    return {} as any;
  };

  isTxValid = (transaction: PaymentTransaction): Promise<boolean> => {
    return {} as any;
  };

  signTransaction = (
    transaction: PaymentTransaction,
    requiredSign: number,
    signFunction: (...arg: any[]) => any
  ): Promise<PaymentTransaction> => {
    return {} as any;
  };

  submitTransaction = (transaction: PaymentTransaction): Promise<void> => {
    return {} as any;
  };

  verifyEvent = (
    event: EventTrigger,
    RwtId: string,
    feeConfig: Fee
  ): Promise<boolean> => {
    return Promise.resolve(false);
  };

  verifyTransactionFee = (transaction: PaymentTransaction): boolean => {
    return false;
  };
}
