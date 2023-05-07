import { AbstractLogger } from '@rosen-bridge/logger-interface';
import {
  AbstractRosenDataExtractor,
  ErgoRosenExtractor,
} from '@rosen-bridge/rosen-extractor';
import { AbstractChainNetwork } from '@rosen-chains/abstract-chain';
import ergoNodeClientFactory from '@rosen-clients/ergo-node';

import * as ergoLib from 'ergo-lib-wasm-nodejs';
import all from 'it-all';
import JsonBigIntFactory from 'json-bigint';

const JsonBigInt = JsonBigIntFactory({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
});

import { TX_FETCHING_PAGE_SIZE } from './constants';

interface ErgoNodeNetworkOptions {
  logger?: AbstractLogger;
  nodeBaseUrl: string;
  extractorOptions: {
    lockAddress: string;
    tokens: ConstructorParameters<typeof ErgoRosenExtractor>['1'];
  };
}

class ErgoNodeNetwork extends AbstractChainNetwork {
  private client: ReturnType<typeof ergoNodeClientFactory>;
  extractor: AbstractRosenDataExtractor<string>;

  constructor({
    extractorOptions,
    logger,
    nodeBaseUrl,
  }: ErgoNodeNetworkOptions) {
    super(logger);
    this.extractor = new ErgoRosenExtractor(
      extractorOptions.lockAddress,
      extractorOptions.tokens,
      logger
    );
    this.client = ergoNodeClientFactory(nodeBaseUrl);
  }

  /**
   * get current block height
   */
  public getHeight = async () => {
    const { indexedHeight } = await this.client.blockchain.getIndexedHeight();
    return Number(indexedHeight);
  };

  /**
   * get confirmations of a tx
   * @param txId
   */
  public getTxConfirmation = async (txId: string) => {
    const { numConfirmations } = await this.client.blockchain.getTxById(txId);
    return Number(numConfirmations);
  };

  /**
   * get all erg and tokens amount in an address
   * @param address
   */
  public getAddressAssets = async (address: string) => {
    const { confirmed } = await this.client.blockchain.getAddressBalanceTotal(
      address
    );

    if (!confirmed) {
      return {
        nativeToken: 0n,
        tokens: [],
      };
    }

    type BalanceInfoTokensItem = (typeof confirmed.tokens)[0];
    const hasTokenAndAmount = (
      token: BalanceInfoTokensItem
    ): token is Required<BalanceInfoTokensItem> => {
      return !!token.tokenId && !!token.amount;
    };

    return {
      nativeToken: confirmed.nanoErgs,
      tokens: confirmed.tokens.filter(hasTokenAndAmount).map((token) => ({
        id: token.tokenId,
        value: token.amount,
      })),
    };
  };

  /**
   * get all tx ids of a block
   * @param blockId
   */
  public getBlockTransactionIds = async (blockId: string) => {
    const { transactions } = await this.client.blocks.getBlockTransactionsById(
      blockId
    );
    const txIds = transactions.map((tx) => tx.id);

    if (txIds.includes(undefined)) {
      throw new Error(
        "An error occurred while getting block transaction ids. Some transactions don't have an id."
      );
    }
    return txIds as string[];
  };

  /**
   * get info of a block
   * @param blockId
   */
  public getBlockInfo = async (blockId: string) => {
    const blockInfo = await this.client.blocks.getBlockHeaderById(blockId);

    return {
      hash: blockId,
      parentHash: blockInfo.parentId,
      height: Number(blockInfo.height),
    };
  };

  /**
   * convert a tx string to its bytes representation
   * @param tx
   */
  private getTransactionBytes = (tx: string) => {
    const ergoLibTx = ergoLib.Transaction.from_json(tx);
    return Buffer.from(ergoLibTx.sigma_serialize_bytes()).toString('hex');
  };

  /**
   * get a transaction by its id, returning hex representation of `ergo-lib` tx
   * bytes
   * @param txId
   * @returns
   */
  public getTransaction = async (txId: string) => {
    const partialTx = await this.client.blockchain.getTxById(txId);
    const blockTxs = await this.client.blocks.getBlockTransactionsById(
      partialTx.blockId
    );
    const tx = blockTxs.transactions.find((tx) => tx.id === txId);
    return this.getTransactionBytes(JsonBigInt.stringify(tx));
  };

  /**
   * submit a transaction to the network
   * @param tx hex representation of `ergo-lib` tx bytes
   */
  public submitTransaction = async (tx: string) => {
    this.client.transactions.sendTransactionAsBytes(tx);
  };

  /**
   * get a mempool tx in each iteration until there are no more txs in it
   */
  private async *getOneMempoolTx() {
    let currentPage = 0;

    while (true) {
      const txsPage = await this.client.transactions.getUnconfirmedTransactions(
        {
          offset: BigInt(currentPage * TX_FETCHING_PAGE_SIZE),
          limit: BigInt(TX_FETCHING_PAGE_SIZE),
        }
      );

      if (txsPage.length) {
        yield* txsPage;
        currentPage += 1;
      } else {
        return;
      }
    }
  }

  /**
   * get all txs in the mempool
   */
  public getMempoolTransactions = async () => {
    const txsPageIterator = this.getOneMempoolTx();
    const txs = await all(txsPageIterator);
    return txs
      .filter((tx) => tx.id)
      .map((tx) => JsonBigInt.stringify(tx))
      .map(this.getTransactionBytes);
  };
}

export default ErgoNodeNetwork;
