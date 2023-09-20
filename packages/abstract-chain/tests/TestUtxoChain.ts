import { AbstractUtxoChain, BoxInfo } from '../lib';

class TestUtxoChain extends AbstractUtxoChain<string> {
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
  getTxConfirmationStatus = this.notImplemented;
  getLockAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMempoolBoxMapping = this.notImplemented;
  getMinimumNativeToken = this.notImplemented;
  getRWTToken = this.notImplemented;
  PaymentTransactionFromJson = this.notImplemented;

  getBoxInfo = (box: string): BoxInfo => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChain;
