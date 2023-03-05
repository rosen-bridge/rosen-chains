import { AbstractUtxoChain } from '../../lib';
import { BoxInfo } from '../../lib';

class TestUtxoChain extends AbstractUtxoChain {
  notImplemented = () => {
    throw Error('Not implemented');
  };

  generatePaymentTransaction = this.notImplemented;
  generateColdStorageTransaction = this.notImplemented;
  verifyPaymentTransaction = this.notImplemented;
  verifyColdStorageTransaction = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  signTransaction = this.notImplemented;
  getPaymentTxConfirmationStatus = this.notImplemented;
  getColdStorageTxConfirmationStatus = this.notImplemented;
  getLockAddressAssets = this.notImplemented;
  getHeight = this.notImplemented;
  submitTransaction = this.notImplemented;
  isTxInMempool = this.notImplemented;
  getMempoolBoxMapping = this.notImplemented;

  getBoxInfo = (serializedBox: string): BoxInfo => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChain;
