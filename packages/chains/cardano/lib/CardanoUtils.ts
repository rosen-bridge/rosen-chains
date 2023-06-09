import {
  CardanoUtxo,
  CardanoAssetInfo,
  UtxoBoxesAssets,
  CardanoBoxCandidate,
} from './types';
import { AssetBalance, TokenInfo } from '@rosen-chains/abstract-chain';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { TokenMap } from '@rosen-bridge/tokens';
import { CARDANO_CHAIN } from './constants';
import { BigNum } from '@emurgo/cardano-serialization-lib-nodejs';
import blake2b from 'blake2b';
import { bech32 } from 'bech32';

class CardanoUtils {
  /**
   * calculates amount of lovelace and assets in utxo boxes
   * @param boxes the utxogenerateTransaction boxes
   */
  static calculateInputBoxesAssets = (
    boxes: CardanoUtxo[]
  ): UtxoBoxesAssets => {
    const assets: Map<string, BigNum> = new Map();
    let changeBoxLovelace: CardanoWasm.BigNum = CardanoWasm.BigNum.zero();
    boxes.forEach((box) => {
      changeBoxLovelace = changeBoxLovelace.checked_add(
        this.bigIntToBigNum(box.value)
      );

      box.assets.forEach((boxAsset) => {
        const assetsInfo = `${boxAsset.policy_id},${boxAsset.asset_name}`;
        const currentValue =
          assets.get(assetsInfo) || CardanoWasm.BigNum.zero();

        assets.set(
          assetsInfo,
          currentValue.checked_add(
            this.bigIntToBigNum(BigInt(boxAsset.quantity))
          )
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
      policyId: token[0][CARDANO_CHAIN]['policyId'],
      assetName: token[0][CARDANO_CHAIN]['assetName'],
    };
  };

  /**
   * gets Cardano box assets
   * @param box the Cardano box
   */
  static getBoxAssets = (box: CardanoWasm.TransactionOutput): AssetBalance => {
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
    const policyIdBytes = policyId.to_bytes();
    const assetNameBytes = Buffer.from(assetName.to_js_value(), 'hex');
    const hashBuf = blake2b(20)
      .update(new Uint8Array([...policyIdBytes, ...assetNameBytes]))
      .digest('binary');
    const words = bech32.toWords(hashBuf);
    return bech32.encode('asset', words);
  };

  /**
   * get box id from CardanoWasm.TransactionInput or CardanoUtxo
   * @param box to fetch d
   * @returns tx_hash.index as box id
   */
  static getBoxId = (
    box: CardanoUtxo | CardanoWasm.TransactionInput
  ): string => {
    if (box instanceof CardanoWasm.TransactionInput) {
      const boxJS = box.to_js_value();
      return boxJS.transaction_id + '.' + boxJS.index;
    }
    return box.txId + '.' + box.index;
  };

  /**
   * converts a CardanoBoxCandidate to CardanoUtxo
   * @param candidate CardanoBoxCandidate object
   * @param txId transaction id
   * @param index box index in transaction outputs list
   */
  static convertCandidateToUtxo = (
    candidate: CardanoBoxCandidate,
    txId: string,
    index: number
  ): CardanoUtxo => ({
    txId: txId,
    index: index,
    value: candidate.value,
    assets: structuredClone(candidate.assets),
  });
}

export default CardanoUtils;
