import { AbstractChainNetwork, BlockInfo } from '../../lib';
import TestRosenDataExtractor from '../TestRosenDataExtractor';

class TestUtxoChainNetwork extends AbstractChainNetwork<string> {
  extractor = new TestRosenDataExtractor();

  notImplemented = () => {
    throw Error('Not implemented');
  };

  getHeight = this.notImplemented;
  getAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;
  getMempoolTransactions = this.notImplemented;
  getTokenDetail = this.notImplemented;

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };
  getBlockInfo = (blockId: string): Promise<BlockInfo> => {
    throw Error('Not mocked');
  };

  getTransaction = (
    transactionId: string,
    blockId: string
  ): Promise<string> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (transactionId: string): Promise<number> => {
    throw Error('Not mocked');
  };
}

export default TestUtxoChainNetwork;
