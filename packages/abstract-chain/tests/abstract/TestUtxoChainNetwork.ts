import { AbstractUtxoChainNetwork } from '../../lib';

class TestUtxoChainNetwork extends AbstractUtxoChainNetwork {
  notImplemented = () => {
    throw Error('Not implemented');
  };

  getHeight = this.notImplemented;
  getTxConfirmation = this.notImplemented;
  getAddressAssets = this.notImplemented;
  getTransaction = this.notImplemented;
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
