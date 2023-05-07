import { AbstractUtxoChainNetwork } from '../../lib';
import TestRosenDataExtractor from '../TestRosenDataExtractor';

class TestUtxoChainNetwork extends AbstractUtxoChainNetwork {
  extractor = new TestRosenDataExtractor();

  notImplemented = () => {
    throw Error('Not implemented');
  };

  getHeight = this.notImplemented;
  getTxConfirmation = this.notImplemented;
  getAddressAssets = this.notImplemented;
  getTransaction = this.notImplemented;
  getBlockTransactionIds = this.notImplemented;
  getBlockInfo = this.notImplemented;
  submitTransaction = this.notImplemented;
  getMempoolTransactions = this.notImplemented;

  isBoxUnspentAndValid = this.notImplemented;

  getAddressBoxes = (
    address: string,
    offset: number,
    limit: number
  ): Promise<string[]> => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChainNetwork;
