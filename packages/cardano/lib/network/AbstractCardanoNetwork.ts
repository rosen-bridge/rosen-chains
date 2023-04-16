import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork {
  // TO-Ask: Do we need extractor?

  /**
   * gets the current network slot
   * @returns the current network slot
   */
  abstract getNetworkSlot: () => Promise<number>;
}

export default AbstractCardanoNetwork;
