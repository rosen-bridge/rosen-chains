interface BlockHeader {
  hash: string;
  number: number;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas: null | bigint;
}
