import {
  AbstractChain,
  AssetBalance,
  PaymentTransaction,
  TransactionAssetBalance,
} from '../lib';

class TestUtxoChain extends AbstractChain {
  notImplemented = () => {
    throw Error('Not implemented');
  };

  generateTransaction = this.notImplemented;
  extractTransactionOrder = this.notImplemented;
  verifyTransactionFee = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  signTransaction = this.notImplemented;
  getTxConfirmationStatus = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMinimumNativeToken = this.notImplemented;

  getTransactionAssets = (
    transaction: PaymentTransaction
  ): TransactionAssetBalance => {
    throw Error('Not mocked');
  };
  getLockAddressAssets = (): Promise<AssetBalance> => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChain;
