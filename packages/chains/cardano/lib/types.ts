import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';
import { BigNum } from '@emurgo/cardano-serialization-lib-nodejs';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  lockAddress: string;
  txTtl: number;
  aggregatedPublicKey: string;
}

interface CardanoAsset {
  policy_id: string;
  asset_name: string;
  quantity: bigint;
  fingerprint: string;
}

interface CardanoAssetInfo {
  policyId: string;
  assetName: string;
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

interface CardanoTx {
  id: string;
  inputs: CardanoUtxo[];
  outputs: CardanoBoxCandidate[];
  fee: bigint;
  metadata?: Record<string, Record<string, any>>;
}

interface UtxoBoxesAssets {
  lovelace: BigNum;
  assets: Map<string, BigNum>;
}

interface CardanoTransactionJsonModel extends PaymentTransactionJsonModel {
  inputUtxos: Array<string>;
}

export {
  CardanoConfigs,
  CardanoAsset,
  CardanoAssetInfo,
  CardanoUtxo,
  CardanoBoxCandidate,
  CardanoTx,
  UtxoBoxesAssets,
  CardanoTransactionJsonModel,
};
