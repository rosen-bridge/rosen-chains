import { AbstractChainNetwork } from '../../lib';
import TestRosenDataExtractor from '../TestRosenDataExtractor';

class TestUtxoChainNetwork extends AbstractChainNetwork {
  extractor = new TestRosenDataExtractor();

  notImplemented = () => {
    throw Error('Not implemented');
  };

  getHeight = this.notImplemented;
  getTxConfirmation = this.notImplemented;
  getAddressAssets = this.notImplemented;
  getTransaction = this.notImplemented;
  getBlockTransactionIds = this.notImplemented;
  submitTransaction = this.notImplemented;
  getMempoolTransactions = this.notImplemented;
}

export default TestUtxoChainNetwork;
