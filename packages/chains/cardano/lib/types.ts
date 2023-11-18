import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';
import { BigNum } from '@emurgo/cardano-serialization-lib-nodejs';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  txTtl: number;
  aggregatedPublicKey: string;
}

interface CardanoAsset {
  policy_id: string;
  asset_name: string;
  quantity: bigint;
}

interface CardanoUtxo {
  txId: string;
  index: number;
  value: bigint;
  assets: Array<CardanoAsset>;
}

interface CardanoBoxCandidate {
  address: string;
  value: bigint;
  assets: Array<CardanoAsset>;
}

type CardanoMetadata = Record<string, string | Record<string, any>>;

interface CardanoTx {
  id: string;
  inputs: CardanoUtxo[];
  outputs: CardanoBoxCandidate[];
  fee: bigint;
  metadata?: CardanoMetadata;
}

interface CardanoTransactionJsonModel extends PaymentTransactionJsonModel {
  inputUtxos: Array<string>;
}

interface CardanoProtocolParameters {
  minFeeA: number;
  minFeeB: number;
  poolDeposit: string;
  keyDeposit: string;
  maxValueSize: number;
  maxTxSize: number;
  coinsPerUtxoSize: string;
}

export {
  CardanoConfigs,
  CardanoAsset,
  CardanoUtxo,
  CardanoBoxCandidate,
  CardanoMetadata,
  CardanoTx,
  CardanoTransactionJsonModel,
  CardanoProtocolParameters,
};
