import { Transaction } from 'ethers';
import { AbstractEvmNetwork } from '../../lib';
import {
  BlockInfo,
  AssetBalance,
  TokenDetail,
} from '@rosen-chains/abstract-chain';
import { BlockHeader } from '../../lib';

class TestEvmNetwork extends AbstractEvmNetwork {
  submitTransaction = async (): Promise<void> => {
    throw Error('Not mocked');
  };

  getAddressAssets = (): Promise<AssetBalance> => {
    throw Error('Not mocked');
  };

  getHeight = (): Promise<number> => {
    throw Error('Not mocked');
  };

  getTransaction = (txId: string, blockId: string): Promise<Transaction> => {
    throw Error('Not mocked');
  };

  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    throw Error('Not mocked');
  };

  getBlockInfo = (blockId: string): Promise<BlockInfo> => {
    throw Error('Not mocked');
  };

  isBoxUnspentAndValid = (boxId: string): Promise<boolean> => {
    throw Error('Not mocked');
  };

  getTxConfirmation = (txId: string): Promise<number> => {
    throw Error('Not mocked');
  };

  getMempoolTransactions = (): Promise<Array<Transaction>> => {
    throw Error('Not mocked');
  };

  getTokenDetail = (tokenId: string): Promise<TokenDetail> => {
    throw Error('Not mocked');
  };

  getAddressBalanceForERC20Asset = (
    address: string,
    tokenId: string
  ): Promise<AssetBalance> => {
    throw Error('Not mocked');
  };

  getAddressBalanceForNativeToken = (address: string): Promise<bigint> => {
    throw Error('Not mocked');
  };

  getBlockHeader = (blockId: string): Promise<BlockHeader> => {
    throw Error('Not mocked');
  };

  getAddressNextAvailableNonce = (address: string): Promise<number> => {
    throw Error('Not mocked');
  };

  getGasRequired = (transaction: Transaction): bigint => {
    throw Error('Not mocked');
  };

  getMaxPriorityFeePerGas = (): Promise<bigint> => {
    throw Error('Not mocked');
  };

  getMaxFeePerGas = (): Promise<bigint> => {
    throw Error('Not mocked');
  };

  getTransactionViaAddressNonce = (
    address: string,
    nonce: bigint
  ): Promise<Transaction | null> => {
    throw Error('Not mocked');
  };
}

export default TestEvmNetwork;
