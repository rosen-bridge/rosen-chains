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

  abstract getUtxo: (tx_hash: string, index: number) => CardanoUtxo;
}

export default AbstractCardanoNetwork;
