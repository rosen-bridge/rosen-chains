import { ChainConfigs } from '@rosen-chains/abstract-chain';

interface BlockHeader {
  hash: string;
  number: number;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas: bigint;
}

interface EvmConfigs extends ChainConfigs {
  maxParallelTx: number;
  slippage: number;
}

export { BlockHeader, EvmConfigs };
