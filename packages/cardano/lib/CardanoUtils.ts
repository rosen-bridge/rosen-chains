import { AddressUtxo, AssetInfo, UtxoBoxesAssets } from './types';
import { AssetBalance, TokenInfo } from '@rosen-chains/abstract-chain';
import {
  AssetName,
  Assets,
  BigNum,
  MultiAsset,
  ScriptHash,
  TransactionOutput,
} from '@emurgo/cardano-serialization-lib-nodejs';
import { default as CIP14 } from '@emurgo/cip14-js';
import { TokenMap } from '@rosen-bridge/tokens';
import { CARDANO_CHAIN } from './constants';

class CardanoUtils {
  /**
   * calculates amount of lovelace and assets in utxo boxes
   * @param boxes the utxogenerateTransaction boxes
   */
  static calculateInputBoxesAssets = (
    boxes: AddressUtxo[]
  ): UtxoBoxesAssets => {
    const multiAsset = MultiAsset.new();
    let changeBoxLovelace: BigNum = BigNum.zero();
    boxes.forEach((box) => {
      changeBoxLovelace = changeBoxLovelace.checked_add(
        BigNum.from_str(box.value)
      );

      box.asset_list.forEach((boxAsset) => {
        const policyId = ScriptHash.from_bytes(
          Buffer.from(boxAsset.policy_id, 'hex')
        );
        const assetName = AssetName.new(
          Buffer.from(boxAsset.asset_name, 'hex')
        );

        const policyAssets = multiAsset.get(policyId);
        if (!policyAssets) {
          const assetList = Assets.new();
          assetList.insert(assetName, BigNum.from_str(boxAsset.quantity));
          multiAsset.insert(policyId, assetList);
        } else {
          const asset = policyAssets.get(assetName);
          if (!asset) {
            policyAssets.insert(assetName, BigNum.from_str(boxAsset.quantity));
            multiAsset.insert(policyId, policyAssets);
          } else {
            const amount = asset.checked_add(
              BigNum.from_str(boxAsset.quantity)
            );
            policyAssets.insert(assetName, amount);
            multiAsset.insert(policyId, policyAssets);
          }
        }
      });
    });
    return {
      lovelace: changeBoxLovelace,
      assets: multiAsset,
    };
  };

  /**
   * returns asset policy id and asset name from tokenMap, throws error if fingerprint not found
   * @param fingerprint asset fingerprint
   * @param tokenMap to search for fingerprint
   */
  static getCardanoAssetInfo = (
    fingerprint: string,
    tokenMap: TokenMap
  ): AssetInfo => {
    const token = tokenMap.search(CARDANO_CHAIN, {
      [tokenMap.getIdKey(CARDANO_CHAIN)]: fingerprint,
    });
    if (token.length === 0)
      throw new Error(`Asset fingerprint [${fingerprint}] not found in config`);
    return {
      policyId: Buffer.from(token[0][CARDANO_CHAIN]['policyId'], 'hex'),
      assetName: Buffer.from(token[0][CARDANO_CHAIN]['assetName'], 'hex'),
    };
  };

  /**
   * gets Cardano box assets
   * @param box the Cardano box
   */
  static getBoxAssets = (box: TransactionOutput): AssetBalance => {
    const tokens: Array<TokenInfo> = [];
    const boxValue = box.amount();
    const boxAssets = boxValue.multiasset();
    if (boxAssets) {
      for (let i = 0; i < boxAssets.keys().len(); i++) {
        const scriptHash = boxAssets.keys().get(i);
        const asset = boxAssets.get(scriptHash)!;
        for (let j = 0; j < asset.keys().len(); j++) {
          const assetName = asset.keys().get(j);
          const assetAmount = asset.get(assetName)!;
          const fingerprint = this.createFingerprint(scriptHash, assetName);
          tokens.push({
            id: fingerprint,
            value: BigInt(assetAmount.to_str()),
          });
        }
      }
    }
    return {
      nativeToken: BigInt(boxValue.coin().to_str()),
      tokens: tokens,
    };
  };

  /**
   * converts bigint to BigNum
   * @param value bigint value
   */
  static bigIntToBigNum = (value: bigint): BigNum => {
    return BigNum.from_str(value.toString());
  };

  /**
   * create fingerprint from policy id and asset name
   * @param policyId in Uint8Array
   * @param assetName in Uint8Array
   */
  static createFingerprint = (
    policyId: ScriptHash,
    assetName: AssetName
  ): string => {
    return CIP14.fromParts(
      policyId.to_bytes(),
      assetName.to_bytes()
    ).fingerprint();
  };
}

export default CardanoUtils;
