import { ChainConfigs } from '@rosen-chains/abstract-chain';

interface BlockHeader {
  hash: string;
  number: number;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas: null | bigint;
}

interface EvmConfigs extends ChainConfigs {
  maxParallelTx: number;
  chainId: number;
}

export { BlockHeader, EvmConfigs };
