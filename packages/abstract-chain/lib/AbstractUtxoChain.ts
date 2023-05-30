import AbstractChain from './AbstractChain';
import AbstractUtxoChainNetwork from './network/AbstractUtxoChainNetwork';
import { AssetBalance, BoxInfo, CoveringBoxes } from './types';
import { GET_BOX_API_LIMIT } from './constants';

abstract class AbstractUtxoChain<BoxType> extends AbstractChain {
  declare network: AbstractUtxoChainNetwork<unknown, BoxType>;

  /**
   * generates mapping from input box id to serialized string of output box (filtered by address, containing the token)
   * @param address the address
   * @param tokenId the token id
   * @returns a Map from input box id to serialized string of output box
   */
  abstract getMempoolBoxMapping: (
    address: string,
    tokenId?: string
  ) => Promise<Map<string, BoxType | undefined>>;

  /**
   * extracts box id and assets of a box
   * @param box the box
   * @returns an object containing the box id and assets
   */
  abstract getBoxInfo: (box: BoxType) => BoxInfo;

  /**
   * gets useful, allowable and last boxes for an address until required assets are satisfied
   * @param address the address
   * @param requiredAssets the required assets
   * @param forbiddenBoxIds the id of forbidden boxes
   * @param trackMap the mapping of a box id to it's next box
   * @returns an object containing the selected boxes with a boolean showing if requirements covered or not
   */
  getCoveringBoxes = async (
    address: string,
    requiredAssets: AssetBalance,
    forbiddenBoxIds: Array<string>,
    trackMap: Map<string, BoxType | undefined>
  ): Promise<CoveringBoxes<BoxType>> => {
    let uncoveredNativeToken = requiredAssets.nativeToken;
    const uncoveredTokens = requiredAssets.tokens.filter(
      (info) => info.value > 0n
    );

    const isRequirementRemaining = () => {
      return uncoveredTokens.length > 0 || uncoveredNativeToken > 0n;
    };

    let offset = 0;
    const result: Array<BoxType> = [];

    // get boxes until requirements are satisfied
    while (isRequirementRemaining()) {
      const boxes = await this.network.getAddressBoxes(
        address,
        offset,
        GET_BOX_API_LIMIT
      );
      offset += GET_BOX_API_LIMIT;

      // end process if there are no more boxes
      if (boxes.length === 0) break;

      // process received boxes
      for (const box of boxes) {
        let trackedBox: BoxType | undefined = box;
        let boxInfo = this.getBoxInfo(box);

        // track boxes
        let skipBox = false;
        while (trackMap.has(boxInfo.id)) {
          trackedBox = trackMap.get(boxInfo.id);
          if (!trackedBox) {
            skipBox = true;
            break;
          }
          boxInfo = this.getBoxInfo(trackedBox);
        }

        // if tracked to no box or forbidden box, skip it
        if (skipBox || forbiddenBoxIds.includes(boxInfo.id)) continue;

        // check and add if box assets are useful to requirements
        let isUseful = false;
        boxInfo.assets.tokens.forEach((boxToken) => {
          const tokenIndex = uncoveredTokens.findIndex(
            (requiredToken) => requiredToken.id === boxToken.id
          );
          if (tokenIndex !== -1) {
            isUseful = true;
            const token = uncoveredTokens[tokenIndex];
            if (token.value > boxToken.value) token.value -= boxToken.value;
            else uncoveredTokens.splice(tokenIndex, 1);
          }
        });
        if (isUseful || uncoveredNativeToken > 0n) {
          uncoveredNativeToken -=
            uncoveredNativeToken >= boxInfo.assets.nativeToken
              ? boxInfo.assets.nativeToken
              : uncoveredNativeToken;
          result.push(trackedBox!);
        }

        // end process if requirements are satisfied
        if (!isRequirementRemaining()) break;
      }
    }

    return {
      covered: !isRequirementRemaining(),
      boxes: result,
    };
  };
}

export default AbstractUtxoChain;
