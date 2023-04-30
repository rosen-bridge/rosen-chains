import { ChainConfigs } from '@rosen-chains/abstract-chain';
import { BigNum, MultiAsset } from '@emurgo/cardano-serialization-lib-nodejs';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  lockAddress: string;
  txTtl: number;
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
  value: string;
  assets: Array<CardanoAsset>;
}

interface CardanoBoxCandidate {
  address: string;
  value: string;
  assets: Array<CardanoAsset>;
}

interface CardanoTx {
  id: string;
  inputs: CardanoUtxo[];
  outputs: CardanoBoxCandidate[];
  // What else?!
}

interface SignedCardanoTx extends CardanoTx {
  witnesses: string[];
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
  SignedCardanoTx,
};
