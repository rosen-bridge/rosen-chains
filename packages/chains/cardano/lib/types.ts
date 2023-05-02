import { ChainConfigs } from '@rosen-chains/abstract-chain';
import { BigNum, MultiAsset } from '@emurgo/cardano-serialization-lib-nodejs';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  lockAddress: string;
  txTtl: number;
  aggregatedPublicKey: string;
}

interface CardanoAsset {
  policy_id: string;
  asset_name: string;
  quantity: string;
  fingerprint: string;
}

interface CardanoAssetInfo {
  policyId: Uint8Array;
  assetName: Uint8Array;
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
  ttl: number;
  fee: bigint;
}

interface UtxoBoxesAssets {
  lovelace: BigNum;
  assets: Map<string, bigint>;
}

export {
  CardanoConfigs,
  CardanoAsset,
  CardanoAssetInfo,
  CardanoUtxo,
  CardanoBoxCandidate,
  CardanoTx,
  UtxoBoxesAssets,
};
