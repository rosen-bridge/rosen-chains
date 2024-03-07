import { AbstractChainNetwork } from '@rosen-chains/abstract-chain';
import { AssetBalance } from '../../../../abstract-chain';
import { TransactionResponse } from 'ethers';
import { BlockHeader } from '../types';

abstract class AbstractEvmNetwork extends AbstractChainNetwork<TransactionResponse> {
  // TODO evm extractor is missing for now
  /**
   * gets the amount of the input ERC20 asset in an address
   * @param address the address
   * @param tokenId the token address
   * @returns an object containing the amount of asset
   */
  abstract getAddressBalanceForERC20Asset: (
    address: string,
    tokenId: string
  ) => Promise<AssetBalance>;

  /**
   * gets the amount of the native token in an address
   * @param address the address
   * @returns a bigint inidcating the amount of native token
   */
  abstract getAddressBalanceForNativeToken: (
    address: string
  ) => Promise<bigint>;

  /**
   * gets the header of the given block
   * @param blockId the block id
   * @returns an object containing block info
   */
  abstract getBlockHeader: (blockId: string) => Promise<BlockHeader>;

  /**
   * gets the next available nonce for the address. Note that it only checks mined transactions.
   * @param address the address
   * @returns an integer indicating next nonce
   */
  abstract getAddressNextNonce: (address: string) => Promise<number>;

  /**
   * gets the gas required to call `transfer` function in the given contract
   * @param contract the contract address
   * @returns required gas as a bigint
   */
  abstract getGasRequiredERC20Transfer: (
    contract: string,
    ...extra: Array<any>
  ) => Promise<bigint>;

  /**
   * gets the gas required to transfer native token
   * @returns required gas as a bigint
   */
  abstract getGasRequiredNativeransfer: (
    ...extra: Array<any>
  ) => Promise<bigint>;
}

export default AbstractEvmNetwork;
