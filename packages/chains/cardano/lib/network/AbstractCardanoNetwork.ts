import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoUtxo } from '../types';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork<string> {
  declare extractor: CardanoRosenExtractor;

  /**
   * gets a transaction (in CardanoTx json string)
   * @param transactionId the transaction id
   * @param blockId the block id
   * @returns the transaction
   */
  declare getTransaction: (
    transactionId: string,
    blockId: string
  ) => Promise<string>;

  /**
   * submits a transaction (in CardanoWasm serialized hex string)
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: string) => Promise<void>;

  /**
   * gets all transactions in mempool (in CardanoTx json string)
   * returns empty list if the chain has no mempool
   * @returns list of transactions in mempool
   */
  declare getMempoolTransactions: () => Promise<Array<string>>;

  /**
   * gets the current network slot
   * @returns the current network slot
   */
  abstract currentSlot: () => Promise<number>;

  /**
   * gets an utxo from the network
   * @param boxId the id of Utxo (txId + . + index)
   * @returns the utxo in CardanoUtxo format
   */
  abstract getUtxo: (boxId: string) => Promise<CardanoUtxo>;
}

export default AbstractCardanoNetwork;
