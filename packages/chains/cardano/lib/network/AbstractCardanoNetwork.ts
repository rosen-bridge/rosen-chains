import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoUtxo } from '../types';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork {
  declare extractor: ErgoRosenExtractor; // TODO: change!

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
  abstract getUtxo: (boxId: string) => CardanoUtxo;
}

export default AbstractCardanoNetwork;
