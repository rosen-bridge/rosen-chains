import {
  CardanoUtxo,
  CardanoAssetInfo,
  UtxoBoxesAssets,
  CardanoBoxCandidate,
} from './types';
import { AssetBalance, TokenInfo } from '@rosen-chains/abstract-chain';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { default as CIP14 } from '@emurgo/cip14-js';
import { TokenMap } from '@rosen-bridge/tokens';
import { CARDANO_CHAIN } from './constants';

class CardanoUtils {
  /**
   * calculates amount of lovelace and assets in utxo boxes
   * @param boxes the utxogenerateTransaction boxes
   */
  static calculateInputBoxesAssets = (
    boxes: CardanoUtxo[]
  ): UtxoBoxesAssets => {
    const assets: Map<string, bigint> = new Map();
    let changeBoxLovelace: CardanoWasm.BigNum = CardanoWasm.BigNum.zero();
    boxes.forEach((box) => {
      changeBoxLovelace = changeBoxLovelace.checked_add(
        CardanoWasm.BigNum.from_str(box.value)
      );

      box.assets.forEach((boxAsset) => {
        const currentValue = assets.get(boxAsset.fingerprint) || 0n;
        assets.set(
          boxAsset.fingerprint,
          currentValue + BigInt(boxAsset.quantity)
        );
      });
    });
    return {
      lovelace: changeBoxLovelace,
      assets: assets,
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
  ): CardanoAssetInfo => {
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
  static getBoxAssets = (
    box: CardanoBoxCandidate | CardanoUtxo
  ): AssetBalance => {
    const tokens: Array<TokenInfo> = [];
    for (const asset of box.assets) {
      const policyId = CardanoWasm.ScriptHash.from_hex(asset.policy_id);
      const assetName = CardanoWasm.AssetName.from_hex(asset.asset_name);
      const fingerprint = this.createFingerprint(policyId, assetName);
      tokens.push({
        id: fingerprint,
        value: BigInt(asset.quantity),
      });
    }
    return {
      nativeToken: BigInt(box.value),
      tokens: tokens,
    };
  };

  /**
   * converts bigint to BigNum
   * @param value bigint value
   */
  static bigIntToBigNum = (value: bigint): CardanoWasm.BigNum => {
    return CardanoWasm.BigNum.from_str(value.toString());
  };

  /**
   * create fingerprint from policy id and asset name
   * @param policyId in Uint8Array
   * @param assetName in Uint8Array
   */
  static createFingerprint = (
    policyId: CardanoWasm.ScriptHash,
    assetName: CardanoWasm.AssetName
  ): string => {
    return CIP14.fromParts(
      policyId.to_bytes(),
      Buffer.from(assetName.to_js_value(), 'hex')
    ).fingerprint();
  };

  static getBoxId = (box: CardanoUtxo): string => {
    return box.txId + '.' + box.index;
  };
}

export default CardanoUtils;
