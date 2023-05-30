import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { ErgoBox, ErgoStateContext, Transaction } from 'ergo-lib-wasm-nodejs';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractErgoNetwork extends AbstractUtxoChainNetwork<
  Transaction,
  ErgoBox
> {
  declare extractor: ErgoRosenExtractor;

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: Transaction) => Promise<void>;

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
   * @returns list of boxes
   */
  abstract getBoxesByTokenId: (
    tokenId: string,
    address: string,
    offset?: number,
    limit?: number
  ) => Promise<Array<ErgoBox>>;
}

export default AbstractErgoNetwork;
