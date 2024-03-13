import {
  AbstractChain,
  AssetBalance,
  PaymentOrder,
  PaymentTransaction,
  TransactionAssetBalance,
  TransactionType,
} from '../lib';

class TestChain extends AbstractChain {
  notImplemented = () => {
    throw Error('Not implemented');
  };

  extractTransactionOrder = this.notImplemented;
  verifyTransactionFee = this.notImplemented;
  verifyTransactionExtraConditions = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  signTransaction = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMinimumNativeToken = this.notImplemented;
  PaymentTransactionFromJson = this.notImplemented;
  rawTxToPaymentTransaction = this.notImplemented;

  generateMultipleTransactions = (
    eventId: string,
    txType: TransactionType,
    order: PaymentOrder,
    unsignedTransactions: PaymentTransaction[],
    serializedSignedTransactions: string[],
    ...extra: Array<any>
  ): Promise<PaymentTransaction[]> => {
    throw Error('Not mocked');
  };

  getTransactionAssets = (
    transaction: PaymentTransaction
  ): Promise<TransactionAssetBalance> => {
    throw Error('Not mocked');
  };
}

export default TestChain;
