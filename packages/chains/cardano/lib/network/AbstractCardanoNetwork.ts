import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoTx, CardanoUtxo } from '../types';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork<CardanoUtxo> {
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
  ) => Promise<CardanoTx>;

  /**
   * submits a transaction (in CardanoWasm serialized hex string)
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: Transaction) => Promise<void>;

  /**
   * gets all transactions in mempool (in CardanoTx json string)
   * returns empty list if the chain has no mempool
   * @returns list of transactions in mempool
   */
  declare getMempoolTransactions: () => Promise<Array<CardanoTx>>;

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
