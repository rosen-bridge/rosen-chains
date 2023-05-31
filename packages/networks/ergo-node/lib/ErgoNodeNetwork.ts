import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { RosenTokens } from '@rosen-bridge/tokens';
import { FailedError } from '@rosen-chains/abstract-chain';
import { AbstractErgoNetwork } from '@rosen-chains/ergo';
import ergoNodeClientFactory from '@rosen-clients/ergo-node';
import { ErgoTransactionOutput } from '@rosen-clients/ergo-node/dist/src/types';

import * as ergoLib from 'ergo-lib-wasm-nodejs';
import { BlockHeaders, ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import all from 'it-all';
import JsonBigIntFactory from 'json-bigint';

import handleApiError from './handleApiError';

const JsonBigInt = JsonBigIntFactory({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
});

const TX_FETCHING_PAGE_SIZE = 50;
const BOX_FETCHING_PAGE_SIZE = 50;

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
    try {
      const { fullHeight } = await this.client.info.getNodeInfo();
      return Number(fullHeight);
    } catch (error: any) {
      return handleApiError(error, 'Failed to get height from Ergo Node:');
    }
  };

  /**
   * get confirmations of a tx or -1 if tx is not in the blockchain
   * @param txId
   */
  public getTxConfirmation = async (txId: string) => {
    try {
      const { numConfirmations } = await this.client.blockchain.getTxById(txId);
      return Number(numConfirmations);
    } catch (error: any) {
      const baseError = 'Failed to get tx confirmations from Ergo Node:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 404) return -1;
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
      });
    }
  };

  /**
   * get all erg and tokens amount in an address
   * @param address
   */
  public getAddressAssets = async (address: string) => {
    try {
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
      const areAllTokensValid = (
        tokens: BalanceInfoTokensItem[]
      ): tokens is Required<BalanceInfoTokensItem>[] =>
        tokens.every((token) => token.tokenId && token.amount);

      if (!areAllTokensValid(confirmed.tokens)) {
        throw new FailedError(
          `An error occurred while getting address [${address}] assets: Some tokens don't have an id or amount.`
        );
      }

      return {
        nativeToken: confirmed.nanoErgs,
        tokens: confirmed.tokens.map((token) => ({
          id: token.tokenId,
          value: token.amount,
        })),
      };
    } catch (error) {
      return handleApiError(
        error,
        'Failed to get address assets from Ergo Node:'
      );
    }
  };

  /**
   * get all tx ids of a block
   * @param blockId
   */
  public getBlockTransactionIds = async (blockId: string) => {
    try {
      const { transactions } =
        await this.client.blocks.getBlockTransactionsById(blockId);
      const txIds = transactions.map((tx) => tx.id);

      if (txIds.includes(undefined)) {
        throw new FailedError(
          `An error occurred while getting block [${blockId}] transaction ids: Some transactions don't have an id.`
        );
      }
      return txIds as string[];
    } catch (error) {
      const baseError = 'Failed to get block transaction ids from Ergo Node:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 404) return [] as string[];
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
      });
    }
  };

  /**
   * get info of a block
   * @param blockId
   */
  public getBlockInfo = async (blockId: string) => {
    try {
      const blockInfo = await this.client.blocks.getBlockHeaderById(blockId);

      return {
        hash: blockId,
        parentHash: blockInfo.parentId,
        height: Number(blockInfo.height),
      };
    } catch (error) {
      return handleApiError(error, 'Failed to get block info from Ergo Node:');
    }
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
   * get a transaction by its id
   * @param txId
   * @param blockId
   * @returns
   */
  public getTransaction = async (txId: string, blockId: string) => {
    try {
      const blockTxs = await this.client.blocks.getBlockTransactionsById(
        blockId
      );
      const tx = blockTxs.transactions.find((tx) => tx.id === txId);
      if (!tx) throw Error(`tx [${txId}] is not in block [${blockId}]`);
      return ergoLib.Transaction.from_json(JsonBigInt.stringify(tx));
    } catch (error) {
      return handleApiError(error, 'Failed to get tx from Ergo Node:');
    }
  };

  /**
   * submit a transaction to the network
   * @param tx the transaction
   */
  public submitTransaction = async (tx: ergoLib.Transaction) => {
    try {
      await this.client.transactions.sendTransactionAsBytes(
        Buffer.from(tx.sigma_serialize_bytes()).toString('hex')
      );
    } catch (error) {
      return handleApiError(
        error,
        'Failed to submit transaciton to Ergo Node:'
      );
    }
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
    try {
      const txsPageIterator = this.getOneMempoolTx();
      const txs = await all(txsPageIterator);
      return txs
        .filter((tx) => tx.id)
        .map((tx) => ergoLib.Transaction.from_json(JsonBigInt.stringify(tx)));
    } catch (error) {
      return handleApiError(
        error,
        'Failed to get mempool transactions from Ergo Node:'
      );
    }
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
   * get utxos of an address
   * @param address
   * @param offset
   * @param limit
   */
  public getAddressBoxes = async (
    address: string,
    offset: number,
    limit: number
  ): Promise<ergoLib.ErgoBox[]> => {
    try {
      const boxes = (await this.getRawAddressBoxes(address, offset, limit)).map(
        (box: any) => ergoLib.ErgoBox.from_json(JsonBigInt.stringify(box))
      );

      return boxes;
    } catch (error) {
      const baseError = 'Failed to get address boxes from Ergo Node:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 400) return [];
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
      });
    }
  };

  /**
   * get utxos of an address containing a token
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
  ): Promise<ergoLib.ErgoBox[]> => {
    try {
      const boxHasToken = (box: ErgoTransactionOutput) =>
        box.assets?.some((asset) => asset.tokenId === tokenId);

      const eligibleBoxes: Array<ergoLib.ErgoBox> = [];
      let currentPage = 0;
      while (eligibleBoxes.length < offset + limit) {
        const boxesPage = await this.getRawAddressBoxes(
          address,
          currentPage * BOX_FETCHING_PAGE_SIZE,
          BOX_FETCHING_PAGE_SIZE
        );
        if (boxesPage.length === 0) break;

        eligibleBoxes.push(
          ...boxesPage
            .filter(boxHasToken)
            .map((box: any) =>
              ergoLib.ErgoBox.from_json(JsonBigInt.stringify(box))
            )
        );
        currentPage++;
      }

      return eligibleBoxes.slice(offset);
    } catch (error) {
      const baseError = 'Failed to get boxes by token id from Ergo Node:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 400) return [];
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
      });
    }
  };

  /**
   * get current state context of blockchain using last ten blocks
   */
  public getStateContext = async () => {
    try {
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
    } catch (error) {
      return handleApiError(
        error,
        'Failed to get state context from Ergo Node:'
      );
    }
  };

  /**
   * check if a box is unspent and valid (that is, exists in the blockchain)
   * @param boxId
   */
  public isBoxUnspentAndValid = async (boxId: string) => {
    try {
      const box = await this.client.blockchain.getBoxById(boxId);

      return !(box as any).spentTransactionId;
    } catch (error) {
      const baseError =
        'Failed to check if box is unspent and valid using Ergo Node:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 404) return false;
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
      });
    }
  };
}

export default ErgoNodeNetwork;
