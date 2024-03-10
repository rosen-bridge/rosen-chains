import {
  AbstractChainNetwork,
  AssetBalance,
} from '@rosen-chains/abstract-chain';
import { BlockHeader } from '../types';
import { TransactionResponse } from 'ethers';

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
   * @param to the recipient address
   * @param amount the amount to be transfered
   * @returns required gas as a bigint
   */
  abstract getGasRequiredERC20Transfer: (
    contract: string,
    to: string,
    amount: bigint
  ) => bigint;

  /**
   * gets the gas required to transfer native token
   * @param to the recipient address
   * @returns required gas as a bigint
   */
  abstract getGasRequiredNativeTransfer: (to: string) => bigint;

  /**
   * gets the maximum wei we would pay to the miner pay gas according
   * to the network's current condition
   * @returns gas price as a bigint
   */
  abstract getMaxPriorityFeePerGas: () => Promise<bigint>;

  /**
   * gets the maximum wei we would pay (miner + base fee) according
   * to the network's current condition
   * @returns gas price as a bigint
   */
  abstract getMaxFeePerGas: () => Promise<bigint>;
}

export default AbstractEvmNetwork;
