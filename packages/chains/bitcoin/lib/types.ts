import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';

export interface BitcoinConfigs extends ChainConfigs {
  aggregatedPublicKey: string;
}

export interface BitcoinTransactionJsonModel
  extends PaymentTransactionJsonModel {
  inputUtxos: Array<string>;
}

export interface BitcoinUtxo {
  txId: string;
  index: number;
  value: bigint;
}

export interface BitcoinTxInput {
  txId: string;
  index: number;
  scriptPubKey: string;
}

export interface BitcoinTxOutput {
  scriptPubKey: string;
  value: bigint;
}

export interface BitcoinTx {
  id: string;
  inputs: BitcoinTxInput[];
  outputs: BitcoinTxOutput[];
}
