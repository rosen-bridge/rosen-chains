import { ChainConfigs } from '@rosen-chains/abstract-chain';

interface BlockHeader {
  hash: string;
  number: number;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas: bigint;
}

type ABIItem = Record<
  string,
  string | boolean | Array<Record<string, string | boolean>>
>;

interface EvmConfigs extends ChainConfigs {
  maxParallelTx: number;
  chainId: number;
  chainName: string;
  abis: Record<string, Array<ABIItem>>;
}

export { BlockHeader, EvmConfigs };
