import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractErgoNetwork extends AbstractUtxoChainNetwork<string> {
  declare extractor: ErgoRosenExtractor;

  /**
   * gets a transaction (in wasm sigma-serialized hex string)
   * @param transactionId the transaction id
   * @param blockId the block id
   * @returns the transaction
   */
  declare getTransaction: (
    transactionId: string,
    blockId: string
  ) => Promise<string>;

  /**
   * submits a transaction (in wasm sigma-serialized hex string)
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: string) => Promise<void>;

  /**
   * gets all transactions in mempool (in wasm sigma-serialized hex string)
   * returns empty list if the chain has no mempool
   * @returns list of transactions in mempool
   */
  declare getMempoolTransactions: () => Promise<Array<string>>;

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
