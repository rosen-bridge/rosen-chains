import { AbstractUtxoChain, BoxInfo } from '../lib';

class TestUtxoChain extends AbstractUtxoChain {
  notImplemented = () => {
    throw Error('Not implemented');
  };

  generateTransaction = this.notImplemented;
  getTransactionAssets = this.notImplemented;
  extractTransactionOrder = this.notImplemented;
  verifyTransactionFee = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  signTransaction = this.notImplemented;
  getPaymentTxConfirmationStatus = this.notImplemented;
  getColdStorageTxConfirmationStatus = this.notImplemented;
  getLockAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMempoolBoxMapping = this.notImplemented;

  getBoxInfo = (serializedBox: string): BoxInfo => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChain;
