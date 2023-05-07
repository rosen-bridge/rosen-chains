import { AbstractErgoNetwork } from '../../lib';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import { testLockAddress } from '../ergoTestUtils';
import { AssetBalance, BlockInfo } from '@rosen-chains/abstract-chain';

class TestErgoNetwork extends AbstractErgoNetwork {
  extractor = new ErgoRosenExtractor(testLockAddress, {
    idKeys: {},
    tokens: [],
  });

  notImplemented = () => {
    throw Error('Not implemented');
  };
  submitTransaction = this.notImplemented;

  getAddressAssets = (): Promise<AssetBalance> => {
    throw Error('Not mocked');
  };

  getHeight = (): Promise<number> => {
    throw Error('Not mocked');
  };

  getTransaction = (txId: string, blockId: string): Promise<string> => {
    throw Error('Not mocked');
  };

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getBlockInfo = (blockId: string): Promise<BlockInfo> => {
    throw Error('Not mocked');
  };

  isBoxUnspentAndValid = (boxId: string): Promise<boolean> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (txId: string): Promise<number> => {
    throw Error('Not mocked');
  };

  getMempoolTransactions = (): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getAddressBoxes = (
    address: string,
    offset: number,
    limit: number
  ): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getStateContext = (): Promise<ErgoStateContext> => {
    throw Error('Not mocked');
  };

  getBoxesByTokenId = (tokenId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };
}

export default TestErgoNetwork;
