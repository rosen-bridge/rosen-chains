import { AbstractBitcoinNetwork, BitcoinTx, BitcoinUtxo } from '../../lib';
import { BlockInfo, TokenDetail } from '@rosen-chains/abstract-chain';
import { BitcoinRosenExtractor } from '@rosen-bridge/rosen-extractor';

class TestBitcoinNetwork extends AbstractBitcoinNetwork {
  extractor = new BitcoinRosenExtractor(
    'bc1qkgp89fjerymm5ltg0hygnumr0m2qa7n22gyw6h',
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
  ): Promise<Array<BitcoinUtxo>> => {
    throw Error('Not mocked');
  };

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getHeight = (): Promise<number> => {
    throw Error('Not mocked');
  };

  getMempoolTransactions = (): Promise<Array<BitcoinTx>> => {
    throw Error('Not mocked');
  };

  getTransaction = (txId: string, blockId: string): Promise<BitcoinTx> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (txId: string): Promise<number> => {
    throw Error('Not mocked');
  };

  isBoxUnspentAndValid = (boxId: string): Promise<boolean> => {
    throw Error('Not mocked');
  };

  getUtxo = (boxId: string): Promise<BitcoinUtxo> => {
    throw Error('Not mocked');
  };

  getBlockInfo = (blockId: string): Promise<BlockInfo> => {
    throw Error('Not mocked');
  };

  getTokenDetail = (tokenId: string): Promise<TokenDetail> => {
    throw Error('Not mocked');
  };

  getFeeRatio = (): Promise<bigint> => {
    throw Error('Not mocked');
  };

  getMempoolTxIds = (): Promise<Array<string>> => {
    throw Error('Not mocked');
  };
}

export default TestBitcoinNetwork;
