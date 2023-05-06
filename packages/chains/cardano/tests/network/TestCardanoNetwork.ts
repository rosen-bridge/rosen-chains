import { AbstractCardanoNetwork } from '../../lib';
import { ConfirmationStatus } from '@rosen-chains/abstract-chain';
import { CardanoUtxo } from '../../lib/types';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';

class TestCardanoNetwork extends AbstractCardanoNetwork {
  extractor = new ErgoRosenExtractor(
    '9es3xKFSehNNwCpuNpY31ScAubDqeLbSWwaCysjN1ee51bgHKTq',
    {
      idKeys: {},
      tokens: [],
    }
  );
  notImplemented = () => {
    throw Error('Not implemented');
  };

  currentSlot = (): Promise<number> => {
    throw Error('Not mocked');
  };

  getAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;

  getAddressBoxes = (
    address: string,
    offset: number,
    limit: number
  ): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getHeight = (): Promise<number> => {
    throw Error('Not mocked');
  };

  getMempoolTransactions = (): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getTransaction = (txId: string, blockId: string): Promise<string> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (txId: string): Promise<ConfirmationStatus> => {
    throw Error('Not mocked');
  };

  isBoxUnspentAndValid = (boxId: string): Promise<boolean> => {
    throw Error('Not mocked');
  };

  getUtxo = (boxId: string): Promise<CardanoUtxo> => {
    throw Error('Not mocked');
  };
}

export default TestCardanoNetwork;
