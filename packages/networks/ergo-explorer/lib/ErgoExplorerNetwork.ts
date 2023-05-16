import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { ErgoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import { RosenTokens } from '@rosen-bridge/tokens';
import { FailedError, UnexpectedApiError } from '@rosen-chains/abstract-chain';
import { AbstractErgoNetwork } from '@rosen-chains/ergo';
import ergoExplorerClientFactory from '@rosen-clients/ergo-explorer';
import { UTransactionInfo } from '@rosen-clients/ergo-explorer/dist/src/v0/types';
import {
  OutputInfo,
  TransactionInfo,
} from '@rosen-clients/ergo-explorer/dist/src/v1/types';

import * as ergoLib from 'ergo-lib-wasm-nodejs';
import all from 'it-all';
import JsonBigIntFactory from 'json-bigint';

import handleApiError from './handleApiError';

const JsonBigInt = JsonBigIntFactory({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
});

const TX_FETCHING_PAGE_SIZE = 50;
const errorCause = {
  EMPTY_TRANSACTIONS: 'empty-transactions',
  NO_BLOCK_HEADERS: 'no-block-headers',
};

interface ErgoExplorerNetworkOptions {
  logger?: AbstractLogger;
  explorerBaseUrl: string;
  extractorOptions: {
    lockAddress: string;
    tokens: RosenTokens;
  };
}

interface ErgoLibSerializableObject {
  sigma_serialize_bytes: () => Uint8Array;
}

class ErgoExplorerNetwork extends AbstractErgoNetwork {
  private client: ReturnType<typeof ergoExplorerClientFactory>;
  extractor: ErgoRosenExtractor;

  constructor({
    extractorOptions,
    logger,
    explorerBaseUrl,
  }: ErgoExplorerNetworkOptions) {
    super(logger);
    this.extractor = new ErgoRosenExtractor(
      extractorOptions.lockAddress,
      extractorOptions.tokens,
      logger
    );
    this.client = ergoExplorerClientFactory(explorerBaseUrl);
  }

  /**
   * get current block height
   */
  public getHeight = async () => {
    try {
      const { height } = await this.client.v1.getApiV1Networkstate();
      return Number(height);
    } catch (error: any) {
      return handleApiError(error, 'Failed to get height from Ergo Explorer:');
    }
  };

  /**
   * get confirmations of a tx or -1 if tx is not in the blockchain
   * @param txId
   */
  public getTxConfirmation = async (txId: string) => {
    try {
      const { numConfirmations } = await this.client.v1.getApiV1TransactionsP1(
        txId
      );
      return Number(numConfirmations);
    } catch (error: any) {
      const baseError = 'Failed to get tx confirmations from Ergo Explorer:';
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
      const balance = await this.client.v1.getApiV1AddressesP1BalanceConfirmed(
        address
      );

      return {
        nativeToken: balance.nanoErgs,
        tokens:
          balance.tokens?.map((token) => ({
            id: token.tokenId,
            value: token.amount,
          })) ?? [],
      };
    } catch (error: any) {
      return handleApiError(
        error,
        'Failed to get address assets from Ergo Explorer:'
      );
    }
  };

  /**
   * get all tx ids of a block
   * @param blockId
   */
  public getBlockTransactionIds = async (blockId: string) => {
    try {
      const {
        block: { blockTransactions },
      } = await this.client.v1.getApiV1BlocksP1(blockId);

      if (!blockTransactions) {
        throw new Error(
          `No transactions found in block [${blockId}]. This may be an issue with the api, because it is not possible to have a block without any transactions.`,
          {
            cause: errorCause.EMPTY_TRANSACTIONS,
          }
        );
      }

      const txIds = blockTransactions.map((tx) => tx.id);

      return txIds;
    } catch (error: any) {
      const baseError =
        'Failed to get block transaction ids from Ergo Explorer:';
      return handleApiError(error, baseError, {
        handleRespondedState: (error) => {
          if (error.response.status === 404) return [] as string[];
          throw new FailedError(
            `${baseError} [${error.response.status}] ${error.response.data.reason}`
          );
        },
        handleUnknownState: (error) => {
          if (error.cause === errorCause.EMPTY_TRANSACTIONS) {
            throw new FailedError(`${baseError} ${error.message}`);
          }
          throw new UnexpectedApiError(`${baseError} ${error.message}`);
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
      const {
        block: { header },
      } = await this.client.v1.getApiV1BlocksP1(blockId);
      return {
        hash: blockId,
        parentHash: header.parentId,
        height: Number(header.height),
      };
    } catch (error: any) {
      return handleApiError(
        error,
        'Failed to get block info from Ergo Explorer:'
      );
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
   * get bytes representation of a tx string
   * @param tx
   */
  private getTxBytes = (tx: string) => {
    const ergoLibTx = ergoLib.Transaction.from_json(tx);
    return this.serializableToHexString(ergoLibTx);
  };

  /**
   * Fix a possible malformed tx (returned by `getApiV1TransactionsP1` api),
   * converting all `null` values for `spendingProof` to an empty string
   * @param tx
   */
  private fixMalformedTx = (tx: TransactionInfo) => ({
    ...tx,
    inputs: tx.inputs?.map((input) => ({
      ...input,
      spendingProof: input.spendingProof || '',
    })),
  });

  /**
   * get a transaction by its id, returning hex representation of `ergo-lib` tx
   * bytes, or throw an error if the tx doesn't belong to the block
   * @param txId
   * @param blockId
   */
  public getTransaction = async (txId: string, blockId: string) => {
    try {
      const possibleMalformedTx = await this.client.v1.getApiV1TransactionsP1(
        txId
      );
      /**
       * The following conversion is needed because the api result of explorer may
       * include `null` values for `spendingProof`, but it causes ergo-lib api to
       * crash.
       */
      const tx = this.fixMalformedTx(possibleMalformedTx);

      if (tx.blockId !== blockId) {
        throw new Error(`Tx [${txId}] doesn't belong to block [${blockId}]`);
      }

      return this.getTxBytes(JsonBigInt.stringify(tx));
    } catch (error: any) {
      return handleApiError(error, 'Failed to get tx from Ergo Explorer:');
    }
  };

  /**
   * submit a transaction to the network
   * @param tx hex representation of `ergo-lib` tx bytes
   */
  public submitTransaction = async (txBytes: string) => {
    try {
      const tx = ergoLib.Transaction.sigma_parse_bytes(
        Buffer.from(txBytes, 'hex')
      ).to_json();
      /**
       * FIXME: The following type assertion is required because the parameter
       * type of `postApiV0TransactionsSend` is wrong. It needs to be removed
       * when the parameter type is fixed.
       *
       * https://git.ergopool.io/ergo/rosen-bridge/rosen-chains/-/issues/24
       */
      await this.client.v0.postApiV0TransactionsSend(tx as any);
      return;
    } catch (error: any) {
      return handleApiError(
        error,
        'Failed to submit transaciton to Ergo Explorer:'
      );
    }
  };

  /**
   * Fix a possible malformed mempool tx (returned by
   * `getApiV0TransactionsUnconfirmed` api), converting all `null` values for
   * `spendingProof.proofBytes` to an empty string
   * @param tx
   */
  private fixMalformedMempoolTx = (tx: UTransactionInfo) => ({
    ...tx,
    inputs: tx.inputs?.map((input) => ({
      ...input,
      spendingProof: {
        extension: input.spendingProof.extension,
        proofBytes: input.spendingProof.proofBytes || '',
      },
    })),
  });

  /**
   * get a mempool tx in each iteration until there are no more txs in it
   */
  private async *getOneMempoolTx() {
    let currentPage = 0;

    while (true) {
      const txsPage = await this.client.v0.getApiV0TransactionsUnconfirmed({
        offset: BigInt(currentPage * TX_FETCHING_PAGE_SIZE),
        limit: BigInt(TX_FETCHING_PAGE_SIZE),
      });

      if (txsPage.items?.length) {
        yield* txsPage.items;
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
      const mempoolTxIterator = this.getOneMempoolTx();
      const txs = await all(mempoolTxIterator);
      return txs
        .map(this.fixMalformedMempoolTx)
        .map((tx) => JsonBigInt.stringify(tx))
        .map(this.getTxBytes);
    } catch (error: any) {
      return handleApiError(
        error,
        'Failed to get mempool transactions from Ergo Explorer:'
      );
    }
  };

  /**
   * get hex string representation of a box
   * @param box
   */
  private boxToHexString = (box: OutputInfo) =>
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
    try {
      const { items: boxes } =
        await this.client.v1.getApiV1BoxesUnspentByaddressP1(address, {
          offset: BigInt(offset),
          limit: BigInt(limit),
        });

      if (!boxes) {
        return [];
      }

      const boxesBytes = boxes.map((box) => this.boxToHexString(box));

      return boxesBytes;
    } catch (error: any) {
      return handleApiError(
        error,
        'Failed to get address boxes from Ergo Explorer:'
      );
    }
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
    try {
      const { items: boxes } =
        await this.client.v1.getApiV1BoxesUnspentBytokenidP1(tokenId, {
          offset: BigInt(offset),
          limit: BigInt(limit),
        });

      if (!boxes) {
        return [];
      }

      const boxesBytes = boxes.map((box) => this.boxToHexString(box));

      return boxesBytes;
    } catch (error) {
      return handleApiError(
        error,
        'Failed to get boxes by token id from Ergo Explorer:'
      );
    }
  };

  /**
   * get current state context of blockchain using last ten blocks
   */
  public getStateContext = async () => {
    try {
      const { items: lastBlocks } = await this.client.v1.getApiV1BlocksHeaders({
        offset: 0n,
        limit: 10n,
      });

      if (!lastBlocks) {
        throw new Error(
          'No block headers returned by the api. This may be an issue with the api, because it is not possible to have no block headers.',
          {
            cause: errorCause.NO_BLOCK_HEADERS,
          }
        );
      }

      const lastBlocksStrings = lastBlocks.map((header) =>
        JsonBigInt.stringify(header)
      );
      const lastBlocksHeaders =
        ergoLib.BlockHeaders.from_json(lastBlocksStrings);
      const lastBlockPreHeader = ergoLib.PreHeader.from_block_header(
        lastBlocksHeaders.get(0)
      );

      const stateContext = new ergoLib.ErgoStateContext(
        lastBlockPreHeader,
        lastBlocksHeaders
      );

      return stateContext;
    } catch (error: any) {
      const baseError = 'Failed to get state context from Ergo Explorer:';
      return handleApiError(error, baseError, {
        handleUnknownState: (error) => {
          if (error.cause === errorCause.NO_BLOCK_HEADERS) {
            throw new FailedError(`${baseError} ${error.message}`);
          }
          throw new UnexpectedApiError(`${baseError} ${error.message}`);
        },
      });
    }
  };

  /**
   * check if a box is unspent and valid (that is, exists in the blockchain)
   * @param boxId
   */
  public isBoxUnspentAndValid = async (boxId: string) => {
    try {
      const box = await this.client.v1.getApiV1BoxesP1(boxId);

      return !box.spentTransactionId;
    } catch (error: any) {
      const baseError =
        'Failed to check if box is unspent and valid using Ergo Explorer:';
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

export default ErgoExplorerNetwork;
