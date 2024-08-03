import { ChainConfigs } from '@rosen-chains/abstract-chain';

export interface EvmConfigs extends ChainConfigs {
  maxParallelTx: number;
  gasPriceSlippage: bigint;
  gasLimitSlippage: bigint;
  gasLimitMultiplier: bigint;
}

export type TssSignFunction = (txHash: Uint8Array) => Promise<{
  signature: string;
  signatureRecovery: string;
}>;

export enum EvmTxStatus {
  failed = 'failed',
  succeed = 'succeed',
  mempool = 'mempool',
  notFound = 'not-found',
}
