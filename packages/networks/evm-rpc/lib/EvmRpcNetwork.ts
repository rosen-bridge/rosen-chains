import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import {
  AssetBalance,
  BlockInfo,
  FailedError,
  TokenDetail,
  UnexpectedApiError,
} from '@rosen-chains/abstract-chain';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { AbstractEvmNetwork, PartialERC20ABI } from '@rosen-chains/evm';
import {
  Block,
  JsonRpcProvider,
  Transaction,
  TransactionResponse,
  ethers,
  FeeData,
} from 'ethers';
import { DataSource } from 'typeorm';
import AddressTxAction from './AddressTxAction';

class EvmRpcNetwork extends AbstractEvmNetwork {
  readonly chain: string;
  protected readonly provider: JsonRpcProvider;
  protected readonly dbAction: AddressTxAction;

  constructor(
    chain: string,
    url: string,
    dataSource: DataSource,
    lockAddress: string,
    authToken?: string,
    logger?: AbstractLogger
  ) {
    super(logger);
    this.chain = chain;
    this.provider = authToken
      ? new JsonRpcProvider(`${url}/${authToken}`)
      : new JsonRpcProvider(`${url}`);
    this.dbAction = new AddressTxAction(lockAddress, dataSource, logger);
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    try {
      return this.provider.getBlockNumber();
    } catch (e: unknown) {
      const baseError = `Failed to fetch current height from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
    }
  };

  /**
   * gets confirmation for a transaction (returns -1 if tx is not mined or found)
   * Note: this function considers the hash as unsigned hash
   *  if the tx was not found, considers it as TxId (signed hash)
   * @param hash the unsigned hash or ID of the transaction
   * @returns the transaction confirmation
   */
  getTxConfirmation = async (hash: string): Promise<number> => {
    // check if hash is representing signed or unsigned version of the tx
    const txRecord = await this.dbAction.getTxByUnsignedHash(hash);
    const transactionId = txRecord === null ? hash : txRecord.signedHash;

    // get transaction confirmation
    try {
      const tx = await this.provider.getTransaction(transactionId);
      this.logger.debug(
        `requested 'getTransaction' of ${
          this.chain
        } RPC with id [${transactionId}]. res: ${JsonBigInt.stringify(tx)}`
      );
      if (!tx) {
        this.logger.debug(`Transaction [${transactionId}] is not found`);
        return -1;
      }
      return await tx.confirmations();
    } catch (e: unknown) {
      const baseError = `Failed to get transaction [${transactionId}] from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
    }
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
    } catch (e: unknown) {
      throw new UnexpectedApiError(baseError + `${e}`);
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
    } catch (e: unknown) {
      throw new UnexpectedApiError(baseError + `${e}`);
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
        } RPC with id [${transactionId}]. res: ${JsonBigInt.stringify(tx)}`
      );
    } catch (e: unknown) {
      throw new UnexpectedApiError(baseError + `${e}`);
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
    try {
      const contract = new ethers.Contract(
        tokenId,
        PartialERC20ABI,
        this.provider
      );
      const name = await contract.name();
      const decimals = await contract.decimals();
      return {
        tokenId: tokenId,
        name: name,
        decimals: decimals,
      };
    } catch (e: unknown) {
      const baseError = `Failed to get token [${tokenId}] details from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
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
    try {
      const contract = new ethers.Contract(
        tokenId,
        PartialERC20ABI,
        this.provider
      );
      const balance = await contract.balanceOf(address);
      this.logger.debug(
        `requested 'balanceOf' method of [${tokenId}] contract from ${
          this.chain
        } RPC. res: ${JsonBigInt.stringify(balance)}`
      );
      return balance;
    } catch (e: unknown) {
      const baseError = `Failed to get address [${address}] token [${tokenId}] balance from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
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
    try {
      const balance = await this.provider.getBalance(address);
      this.logger.debug(
        `requested 'getBalance' of ${
          this.chain
        } RPC with address [${address}]. res: ${JsonBigInt.stringify(balance)}`
      );
      return balance;
    } catch (e: unknown) {
      const baseError = `Failed to get address [${address}] native token balance from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
    }
  };

  /**
   * gets the next available nonce for the address. Note that it only checks mined transactions.
   * @param address the address
   * @returns an integer indicating next nonce
   */
  getAddressNextAvailableNonce = async (address: string): Promise<number> => {
    try {
      const nonce = await this.provider.getTransactionCount(address);
      this.logger.debug(
        `requested 'getTransactionCount' of ${
          this.chain
        } RPC with address [${address}]. res: ${JsonBigInt.stringify(nonce)}`
      );
      return nonce;
    } catch (e: unknown) {
      const baseError = `Failed to get address [${address}] nonce from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
    }
  };

  /**
   * gets gas required to execute the transaction
   * @param transaction the transaction to be run
   * @returns gas required in bigint
   */
  getGasRequired = async (transaction: Transaction): Promise<bigint> => {
    try {
      const gas = await this.provider.estimateGas(transaction);
      this.logger.debug(
        `requested 'estimateGas' of ${
          this.chain
        } RPC. res: ${JsonBigInt.stringify(gas)}`
      );
      return gas;
    } catch (e: unknown) {
      const baseError = `Failed to get required Gas from ${this.chain} RPC: `;
      throw new UnexpectedApiError(baseError + `${e}`);
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
      this.logger.debug(
        `requested 'getFeeData' of ${
          this.chain
        } RPC. res: ${JsonBigInt.stringify(feeData)}`
      );
    } catch (e: unknown) {
      throw new UnexpectedApiError(baseError + `${e}`);
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
      this.logger.debug(
        `requested 'getFeeData' of ${
          this.chain
        } RPC. res: ${JsonBigInt.stringify(feeData)}`
      );
    } catch (e: unknown) {
      throw new UnexpectedApiError(baseError + `${e}`);
    }
    if (feeData.maxFeePerGas === null)
      throw new UnexpectedApiError(baseError + `maxFeePerGas is null`);
    return feeData.maxFeePerGas;
  };
}

export default EvmRpcNetwork;
