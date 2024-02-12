import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { Psbt } from 'bitcoinjs-lib';
import { BitcoinTx, BitcoinUtxo } from '../types';

abstract class AbstractBitcoinNetwork extends AbstractUtxoChainNetwork<
  BitcoinTx,
  BitcoinUtxo
> {
  // TODO: uncomment this line (local:ergo/rosen-bridge/utils#169)
  // abstract extractor: BitcoinRosenExtractor;

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  abstract submitTransaction: (transaction: Psbt) => Promise<void>;

  /**
   * gets a utxo from the network
   * @param boxId the id of Utxo (txId + . + index)
   * @returns the utxo in BitcoinUtxo format
   */
  abstract getUtxo: (boxId: string) => Promise<BitcoinUtxo>;

  /**
   * gets current fee ratio of the network
   * @returns
   */
  abstract getFeeRatio: () => Promise<bigint>;

  /**
   * gets id of transactions in mempool
   * @returns
   */
  abstract getMempoolTxIds: () => Promise<Array<string>>;
}

export default AbstractBitcoinNetwork;
