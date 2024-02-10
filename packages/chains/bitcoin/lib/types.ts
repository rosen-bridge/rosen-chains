import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';

export interface BitcoinConfigs extends ChainConfigs {
  minBoxValue: bigint;
}

export interface BitcoinTransactionJsonModel
  extends PaymentTransactionJsonModel {
  inputUtxos: Array<string>;
}

export interface BitcoinInput {
  txId: string;
  index: number;
  scriptPubKey: string;
}

export interface BitcoinUtxo extends BitcoinInput {
  value: bigint;
}

export interface BitcoinTx {
  id: string;
  inputs: BitcoinInput[];
  outputs: BitcoinUtxo[];
}
