import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';

export interface BitcoinConfigs extends ChainConfigs {
  minBoxValue: bigint;
}

export interface BitcoinUtxo {
  txId: string;
  index: number;
  value: bigint;
}

export interface BitcoinTransactionJsonModel
  extends PaymentTransactionJsonModel {
  inputUtxos: Array<string>;
}
