import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AssetBalance,
  BlockInfo,
  FailedError,
  NetworkError,
  TokenDetail,
  UnexpectedApiError,
} from '@rosen-chains/abstract-chain';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { AbstractEvmNetwork, ERC20ABI } from '@rosen-chains/evm';
import {
  Block,
  JsonRpcProvider,
  Transaction,
  TransactionResponse,
  ethers,
  FeeData,
} from 'ethers';

class EvmRpcNetwork extends AbstractEvmNetwork {
  readonly chain: string;
  protected readonly provider: JsonRpcProvider;

  constructor(
    chain: string,
    url: string,
    authToken?: string,
    logger?: AbstractLogger
  ) {
    super(logger);
    this.chain = chain;
    this.provider = authToken
      ? new JsonRpcProvider(`${url}/${authToken}`)
      : new JsonRpcProvider(`${url}`);
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    try {
      return this.provider.getBlockNumber();
    } catch (e: any) {
      const baseError = `Failed to fetch current height from ${this.chain} RPC: `;
      if (e.response) {
        throw new FailedError(baseError + `${e.response.data}`);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets confirmation for a transaction (returns -1 if tx is not mined or found)
   * Note: this functions gets transaction unsigned hash instead of tx id
   * @param transactionUnsignedHash the unsigned hash of the transaction
   * @returns the transaction confirmation
   */
  getTxConfirmation = async (
    transactionUnsignedHash: string
  ): Promise<number> => {
    // TODO:
    //  it should check if the tx is in database
    //    yes: this is unsigned hash, should fetch the txId from database
    //    no: this is TxId (signed hash)
    //  then use `getTxConfirmation` function of the network
    throw Error(`not implemented`);
  };

  /**
   * gets the amount of each asset in an address
   * @param address the address
   * @returns an object containing the amount of each asset
   */
  getAddressAssets = async (address: string): Promise<AssetBalance> => {
    throw Error(
      `Function \`getAddressAssets\` is not supported for EVM chains. Use \`getAddressBalanceForERC20Asset\` or \`getAddressBalanceForNativeToken\`.`
    );
  };

  /**
   * gets id of all transactions in the given block
   * @param blockId the block id
   * @returns list of the transaction ids in the block
   */
  getBlockTransactionIds = async (blockId: string): Promise<Array<string>> => {
    const baseError = `Failed to get block [${blockId}] transaction ids from ${this.chain} RPC: `;
    let block: Block | null;
    try {
      block = await this.provider.getBlock(blockId);
      this.logger.debug(
        `requested 'getBlock' of ${
          this.chain
        } RPC for blockId [${blockId}]. res: ${JsonBigInt.stringify(block)}`
      );
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (block) return [...block.transactions];
    throw new FailedError(baseError + 'Block not found');
  };

  /**
   * gets info of the given block
   * @param blockId the block id
   * @returns an object containing block info
   */
  getBlockInfo = async (blockId: string): Promise<BlockInfo> => {
    const baseError = `Failed to get block [${blockId}] info from ${this.chain} RPC: `;
    let block: Block | null;
    try {
      block = await this.provider.getBlock(blockId);
      this.logger.debug(
        `requested 'getBlock' of ${
          this.chain
        } RPC for blockId [${blockId}]. res: ${JsonBigInt.stringify(block)}`
      );
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (block)
      return {
        hash: blockId,
        parentHash: block.parentHash,
        height: block.number,
      };
    throw new FailedError(baseError + 'Block not found');
  };

  /**
   * gets a transaction (serialized in `BitcoinTx` format)
   * @param transactionId the transaction id
   * @param blockId the block id
   * @returns the transaction
   */
  getTransaction = async (
    transactionId: string,
    blockId: string
  ): Promise<Transaction> => {
    const baseError = `Failed to get transaction [${transactionId}] from ${this.chain} RPC: `;
    let tx: TransactionResponse | null;
    try {
      tx = await this.provider.getTransaction(transactionId);
      this.logger.debug(
        `requested 'getTransaction' of ${
          this.chain
        } RPC with id [${transactionId}] and blockId [${blockId}]. res: ${JsonBigInt.stringify(
          tx
        )}`
      );
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (!tx) throw new FailedError(baseError + 'Transaction not found');
    else if (tx.blockHash !== blockId)
      throw new FailedError(
        baseError + `Transaction does not belong to block [${blockId}]`
      );
    else return Transaction.from(tx);
  };

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  submitTransaction = async (transaction: Transaction): Promise<void> => {
    await this.provider.broadcastTransaction(transaction.toJSON());
  };

  /**
   * gets token details (name, decimals)
   * @param tokenId
   */
  getTokenDetail = async (tokenId: string): Promise<TokenDetail> => {
    const baseError = `Failed to get token [${tokenId}] details from ${this.chain} RPC: `;
    try {
      const contract = new ethers.Contract(tokenId, ERC20ABI, this.provider);
      const name = await contract.name();
      const decimals = await contract.decimals();
      return {
        tokenId: tokenId,
        name: name,
        decimals: decimals,
      };
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets the amount of the input ERC20 asset in an address
   * @param address the address
   * @param tokenId the token address
   * @returns the amount of asset in bigint
   */
  getAddressBalanceForERC20Asset = async (
    address: string,
    tokenId: string
  ): Promise<bigint> => {
    const baseError = `Failed to get address [${address}] token [${tokenId}] balance from ${this.chain} RPC: `;
    try {
      const contract = new ethers.Contract(tokenId, ERC20ABI, this.provider);
      return await contract.balanceOf(address);
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets the amount of the native token in an address
   * @param address the address
   * @returns the amount of native token in bigint
   */
  getAddressBalanceForNativeToken = async (
    address: string
  ): Promise<bigint> => {
    const baseError = `Failed to get address [${address}] native token balance from ${this.chain} RPC: `;
    try {
      return await this.provider.getBalance(address);
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets the next available nonce for the address. Note that it only checks mined transactions.
   * @param address the address
   * @returns an integer indicating next nonce
   */
  getAddressNextAvailableNonce = async (address: string): Promise<number> => {
    const baseError = `Failed to get address [${address}] nonce from ${this.chain} RPC: `;
    try {
      return await this.provider.getTransactionCount(address);
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets gas required to execute the transaction
   * @param transaction the transaction to be run
   * @returns gas required in bigint
   */
  getGasRequired = async (transaction: Transaction): Promise<bigint> => {
    const baseError = `Failed to get required Gas from ${this.chain} RPC: `;
    try {
      return await this.provider.estimateGas(transaction);
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
  };

  /**
   * gets the maximum wei we would pay to the miner according
   * to the network's current condition
   * @returns gas price as a bigint
   */
  getMaxPriorityFeePerGas = async (): Promise<bigint> => {
    const baseError = `Failed to get max priority fee per Gas from ${this.chain} RPC: `;
    let feeData: FeeData;
    try {
      feeData = await this.provider.getFeeData();
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (feeData.maxPriorityFeePerGas === null)
      throw new UnexpectedApiError(baseError + `maxPriorityFeePerGas is null`);
    return feeData.maxPriorityFeePerGas;
  };

  /**
   * gets the maximum wei we would pay (miner + base fee) according
   * to the network's current condition
   * @returns gas price as a bigint
   */
  getMaxFeePerGas = async (): Promise<bigint> => {
    const baseError = `Failed to get max fee per Gas from ${this.chain} RPC: `;
    let feeData: FeeData;
    try {
      feeData = await this.provider.getFeeData();
    } catch (e: any) {
      if (e.response) {
        throw new FailedError(baseError + e.response.data);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (feeData.maxFeePerGas === null)
      throw new UnexpectedApiError(baseError + `maxFeePerGas is null`);
    return feeData.maxFeePerGas;
  };
}

export default EvmRpcNetwork;
