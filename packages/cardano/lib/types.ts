import { ChainConfigs } from '@rosen-chains/abstract-chain';
import { BigNum, MultiAsset } from '@emurgo/cardano-serialization-lib-nodejs';

interface CardanoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  lockAddress: string;
  txTtl: number;
}

interface Asset {
  policy_id: string;
  asset_name: string;
  quantity: string;
  fingerprint: string;
}

interface AssetInfo {
  policyId: Uint8Array;
  assetName: Uint8Array;
}

interface AddressUtxo {
  tx_hash: string;
  tx_index: number;
  value: string;
  asset_list: Array<Asset>;
}

interface UtxoBoxesAssets {
  lovelace: BigNum;
  assets: Map<string, bigint>;
}

export { CardanoConfigs, AddressUtxo, Asset, AssetInfo, UtxoBoxesAssets };
