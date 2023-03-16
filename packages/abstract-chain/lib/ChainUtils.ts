import { AssetBalance, TokenInfo } from './types';
import { ValueError } from './errors';

class ChainUtils {
  /**
   * compares two AssetBalance
   * @param a first AssetBalance object
   * @param b second AssetBalance object
   * @returns true if are equal
   */
  static isEqualAssetBalance = (a: AssetBalance, b: AssetBalance): boolean => {
    // check native token is equal
    if (a.nativeToken !== b.nativeToken) return false;

    // check all tokens in `a` exist in `b`
    for (let i = 0; i < a.tokens.length; i++) {
      const token = a.tokens[i];
      const targetToken = b.tokens.find((item) => item.id === token.id);
      if (!targetToken || targetToken.value !== token.value) return false;
    }

    // check all tokens in `b` exist in `a`
    for (let i = 0; i < b.tokens.length; i++) {
      const token = b.tokens[i];
      const targetToken = a.tokens.find((item) => item.id === token.id);
      if (!targetToken || targetToken.value !== token.value) return false;
    }

    return true;
  };

  /**
   * sums two AssetBalance
   * @param a first AssetBalance object
   * @param b second AssetBalance object
   * @returns aggregated AssetBalance
   */
  static sumAssetBalance = (a: AssetBalance, b: AssetBalance): AssetBalance => {
    // sum native token
    const nativeToken = a.nativeToken + b.nativeToken;
    const tokens: Array<TokenInfo> = [];

    // add all tokens to result
    [...a.tokens, ...b.tokens].forEach((token) => {
      const targetToken = tokens.find((item) => item.id === token.id);
      if (targetToken) targetToken.value += token.value;
      else tokens.push(structuredClone(token));
    });

    return {
      nativeToken,
      tokens,
    };
  };

  /**
   * reduces two AssetBalance
   * @param a first AssetBalance object
   * @param b second AssetBalance object
   * @param minimumNativeToken minimum allowed native token
   * @returns reduced AssetBalance
   */
  static reduceAssetBalance = (
    a: AssetBalance,
    b: AssetBalance,
    minimumNativeToken = 0n
  ): AssetBalance => {
    // sum native token
    let nativeToken = 0n;
    if (a.nativeToken > b.nativeToken + minimumNativeToken)
      nativeToken = a.nativeToken + b.nativeToken;
    else
      throw new ValueError(
        `Cannot reduce native token: [${a.nativeToken}] is less than [${b.nativeToken} + ${minimumNativeToken}]`
      );

    // reduce all `b` tokens
    const tokens = structuredClone(a.tokens);
    b.tokens.forEach((token) => {
      const index = tokens.findIndex((item) => item.id === token.id);
      if (index !== -1) {
        if (tokens[index].value > token.value)
          tokens[index].value -= token.value;
        else if (tokens[index].value === token.value) tokens.splice(index, 1);
        else
          throw new ValueError(
            `Cannot reduce token [${token.id}]: [${tokens[index].value}] is less than [${token.value}]`
          );
      } else
        throw new ValueError(
          `Cannot reduce token [${token.id}]: Token not found`
        );
    });

    return {
      nativeToken,
      tokens,
    };
  };
}

export default ChainUtils;
