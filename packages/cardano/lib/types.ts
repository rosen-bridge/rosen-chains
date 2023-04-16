import { ChainConfigs } from '@rosen-chains/abstract-chain';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
}

export { CardanoConfigs };
