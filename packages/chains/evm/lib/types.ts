interface BlockHeader {
  hash: string;
  number: number;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas: null | bigint;
}

interface EIP1559Fee {
  gasLimit: bigint;
  baseFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
}

interface EvmTx {
  hash: string;
  value: bigint;
  from: string;
  data: string;
  to: string;
  nonce: number;
  fee: EIP1559Fee;
}

export { BlockHeader, EvmTx };
