import { AbstractErgoNetwork } from '../../lib';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import { testLockAddress } from '../ergoTestUtils';
import { ConfirmationStatus } from '@rosen-chains/abstract-chain';

class TestErgoNetwork extends AbstractErgoNetwork {
  extractor = new ErgoRosenExtractor(testLockAddress, {
    idKeys: {},
    tokens: [],
  });

  notImplemented = () => {
    throw Error('Not implemented');
  };

  getHeight = this.notImplemented;
  getAddressAssets = this.notImplemented;
  submitTransaction = this.notImplemented;

  getTransaction = (txId: string, blockId: string): Promise<string> => {
    throw Error('Not mocked');
  };

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  isBoxUnspentAndValid = (boxId: string): Promise<boolean> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (txId: string): Promise<ConfirmationStatus> => {
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
