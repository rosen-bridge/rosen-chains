import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractErgoNetwork extends AbstractUtxoChainNetwork {
  declare extractor: ErgoRosenExtractor;

  /**
   * gets the context of blockchain using 10 last blocks
   * @returns the state context object
   */
  abstract getStateContext: () => Promise<ErgoStateContext>;

  /**
   * gets confirmed and unspent boxes by tokenId
   * @param tokenId
   * @param address
   * @param offset
   * @param limit
   * @returns list of serialized string of the boxes
   */
  abstract getBoxesByTokenId: (
    tokenId: string,
    address: string,
    offset?: number,
    limit?: number
  ) => Promise<Array<string>>;
}

export default AbstractErgoNetwork;
