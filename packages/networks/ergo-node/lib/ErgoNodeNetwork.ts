import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractErgoNetwork } from '@rosen-chains/ergo';
import ergoNodeClientFactory from '@rosen-clients/ergo-node';
import { ErgoTransactionOutput } from '@rosen-clients/ergo-node/dist/src/types';

import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { BlockHeaders, ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import all from 'it-all';
import JsonBigIntFactory from 'json-bigint';

const JsonBigInt = JsonBigIntFactory({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
});

const TX_FETCHING_PAGE_SIZE = 50;

interface ErgoNodeNetworkOptions {
  logger?: AbstractLogger;
  nodeBaseUrl: string;
  extractorOptions: {
    lockAddress: string;
    tokens: RosenTokens;
  };
}

interface ErgoLibSerializableObject {
  sigma_serialize_bytes: () => Uint8Array;
}

class ErgoNodeNetwork extends AbstractErgoNetwork {
  private client: ReturnType<typeof ergoNodeClientFactory>;
  extractor: ErgoRosenExtractor;

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
    const { fullHeight } = await this.client.info.getNodeInfo();
    return Number(fullHeight);
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
        `An error occurred while getting block [${blockId}] transaction ids: Some transactions don't have an id.`
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
   * get hex representation of a byte array
   * @param uint8array
   */
  private uint8ArrayToHexString = (uint8array: Uint8Array) =>
    Buffer.from(uint8array).toString('hex');

  /**
   * get hex string representation of a serializable ergo lib object
   * @param serializable an ergo lib object with `sigma_serialize_bytes` prop
   */
  private serializableToHexString = (serializable: ErgoLibSerializableObject) =>
    this.uint8ArrayToHexString(serializable.sigma_serialize_bytes());

  /**
   * convert a tx string to its bytes representation
   * @param tx
   */
  private getTransactionBytes = (tx: string) => {
    const ergoLibTx = ergoLib.Transaction.from_json(tx);
    return this.serializableToHexString(ergoLibTx);
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

  /**
   * get utxos of an address
   * @param address
   * @param offset
   * @param limit
   */
  private getRawAddressBoxes = async (
    address: string,
    offset: number,
    limit: number
  ) => {
    const boxes = await this.client.blockchain.getBoxesByAddressUnspent(
      address,
      {
        offset: BigInt(offset),
        limit: BigInt(limit),
      }
    );

    // Type assertion is needed because the types returned by client are wrong
    return boxes as any;
  };

  /**
   * get hex string representation of a box
   * @param box
   */
  private boxToHexString = (box: ErgoTransactionOutput) =>
    this.serializableToHexString(
      ergoLib.ErgoBox.from_json(JsonBigInt.stringify(box))
    );

  /**
   * get hex representation of utxos of an address
   * @param address
   * @param offset
   * @param limit
   */
  public getAddressBoxes = async (
    address: string,
    offset: number,
    limit: number
  ) => {
    const boxes = await this.getRawAddressBoxes(address, offset, limit);

    const boxesBytes = boxes.map(this.boxToHexString);

    return boxesBytes;
  };

  /**
   * get hex representation of utxos of an address containing a token
   * @param tokenId
   * @param address
   * @param offset
   * @param limit
   */
  public getBoxesByTokenId = async (
    tokenId: string,
    address: string,
    offset = 0,
    limit = 5
  ) => {
    const allAddressBoxes = await this.getRawAddressBoxes(
      address,
      offset,
      limit
    );

    const boxHasToken = (box: ErgoTransactionOutput) =>
      box.assets?.some((asset) => asset.tokenId === tokenId);

    const eligibleBoxes = allAddressBoxes
      .filter(boxHasToken)
      .map(this.boxToHexString);

    return eligibleBoxes;
  };

  /**
   * get current state context of blockchain using last ten blocks
   */
  public getStateContext = async () => {
    const lastBlocks = await this.client.blocks.getLastHeaders(10n);

    const lastBlocksStrings = lastBlocks.map((header) =>
      JsonBigInt.stringify(header)
    );
    const lastBlocksHeaders = BlockHeaders.from_json(lastBlocksStrings);
    const lastBlockPreHeader = ergoLib.PreHeader.from_block_header(
      lastBlocksHeaders.get(0)
    );

    const stateContext = new ErgoStateContext(
      lastBlockPreHeader,
      lastBlocksHeaders
    );

    return stateContext;
  };

  /**
   * check if a box is unspent and valid (that is, exists in the blockchain)
   * @param boxId
   */
  public isBoxUnspentAndValid = async (boxId: string) => {
    const box = await this.client.blockchain.getBoxById(boxId);

    return !(box as any).spentTransactionId;
  };
}

export default ErgoNodeNetwork;
