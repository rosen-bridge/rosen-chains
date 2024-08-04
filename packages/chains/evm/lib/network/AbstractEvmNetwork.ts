import { AbstractChainNetwork } from '@rosen-chains/abstract-chain';
import { Transaction, TransactionResponse } from 'ethers';
import { EvmTxStatus } from '../types';

abstract class AbstractEvmNetwork extends AbstractChainNetwork<Transaction> {
  /**
   * gets the amount of the input ERC20 asset in an address
   * @param address the address
   * @param tokenId the token address
   * @returns the amount of asset in bigint
   */
  abstract getAddressBalanceForERC20Asset: (
    address: string,
    tokenId: string
  ) => Promise<bigint>;

  /**
   * gets the amount of the native token in an address
   * @param address the address
   * @returns the amount of native token in bigint
   */
  abstract getAddressBalanceForNativeToken: (
    address: string
  ) => Promise<bigint>;

  /**
   * gets the next available nonce for the address. Note that it only checks mined transactions.
   * @param address the address
   * @returns an integer indicating next nonce
   */
  abstract getAddressNextAvailableNonce: (address: string) => Promise<number>;

  /**
   * gets gas required to execute the transaction
   * @param transaction the transaction to be run
   * @returns gas required in bigint
   */
  abstract getGasRequired: (transaction: Transaction) => Promise<bigint>;
  /**
   * gets the maximum wei we would pay to the miner according
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

  /**
   * gets all transactions in mempool (returns empty list if the chain has no mempool)
   * Note: we ignore getting mempool txs in Evm, as it doesn't affect us
   * @returns empty list
   */
  getMempoolTransactions = async (): Promise<Array<Transaction>> => {
    return [];
  };

  /**
   * gets the transaction status (mempool, succeed, failed)
   * @param hash the unsigned hash or ID of the transaction
   * @returns the transaction status
   */
  abstract getTransactionStatus: (hash: string) => Promise<EvmTxStatus>;
}

export default AbstractEvmNetwork;
