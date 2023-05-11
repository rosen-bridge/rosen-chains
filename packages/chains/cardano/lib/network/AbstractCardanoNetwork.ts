import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoUtxo } from '../types';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork {
  declare extractor: CardanoRosenExtractor;

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
