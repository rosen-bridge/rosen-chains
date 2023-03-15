import { AssetBalance } from '../types';
import { AbstractLogger, DummyLogger } from '@rosen-bridge/logger-interface';

abstract class AbstractChainNetwork {
  logger: AbstractLogger;

  constructor(logger?: AbstractLogger) {
    this.logger = logger ? logger : new DummyLogger();
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  abstract getHeight: () => Promise<number>;

  /**
   * gets confirmation for a transaction
   * @param transactionId the transaction id
   * @returns the transaction confirmation
   */
  abstract getTxConfirmation: (transactionId: string) => Promise<number>;

  /**
   * gets the amount of each asset in an address
   * @param address the address
   * @returns an object containing the amount of each asset
   */
  abstract getAddressAssets: (address: string) => Promise<AssetBalance>;

  /**
   * gets id of all transactions in the given block
   * @param blockId the block id
   * @returns list of the transaction ids in the block
   */
  abstract getBlockTransactionIds: (blockId: string) => Promise<string[]>;

  /**
   * gets a transaction
   * @param transactionId the transaction id
   * @param blockId the block id
   * @returns the serialized string of the transaction
   */
  abstract getTransaction: (
    transactionId: string,
    blockId: string
  ) => Promise<string>;

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  abstract submitTransaction: (transaction: string) => Promise<void>;

  /**
   * gets all transactions in mempool (returns empty list if the chain has no mempool)
   * @returns list of serialized string of the transactions in mempool
   */
  abstract getMempoolTransactions: () => Promise<string[]>;
}

export default AbstractChainNetwork;
