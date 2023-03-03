import AbstractUtxoChain from '../../lib/abstract/AbstractUtxoChain';
import AbstractUtxoChainNetwork from '../../lib/abstract/network/AbstractUtxoChainNetwork';
import { BoxInfo } from '../../lib/abstract/Interfaces';

class TestUtxoChain extends AbstractUtxoChain {
  constructor(network: AbstractUtxoChainNetwork) {
    super(network);
  }

  notImplemented = () => {
    throw Error('Not implemented');
  };

  generatePaymentTransaction = this.notImplemented;
  generateColdStorageTransaction = this.notImplemented;
  verifyPaymentTransaction = this.notImplemented;
  verifyColdStorageTransaction = this.notImplemented;
  verifyEvent = this.notImplemented;
  isTxValid = this.notImplemented;
  requestToSign = this.notImplemented;
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
