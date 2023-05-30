import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoTx, CardanoUtxo } from '../types';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork<
  CardanoTx,
  CardanoUtxo
> {
  declare extractor: CardanoRosenExtractor;

  /**
   * submits a transaction (in CardanoWasm serialized hex string)
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: Transaction) => Promise<void>;

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
