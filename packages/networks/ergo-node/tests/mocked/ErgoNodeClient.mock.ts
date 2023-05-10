import ergoNodeClientFactory from '@rosen-clients/ergo-node';
import { vi } from 'vitest';

import {
  testAddressBalance,
  testAddressBoxes,
  testBlockHeaders,
  testHeight,
  testLastBlockHeaders,
  testMempoolTransactions,
  testPartialTransactions,
  testTransaction,
} from '../testData';

/**
 * mock `getNodeInfo` of ergo node client
 */
export const mockGetNodeInfo = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    info: {
      getNodeInfo: async () => ({
        fullHeight: testHeight,
      }),
    },
  } as any);

/**
 * mock `getTxById` of ergo node client
 */
export const mockGetTxById = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getTxById: async () => testTransaction,
    },
  } as any);

/**
 * mock `getAddressBalanceTotal` of ergo node client
 * @param balance
 */
export const mockGetAddressBalanceTotal = (
  balance: typeof testAddressBalance | null = testAddressBalance
) =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getAddressBalanceTotal: async () => ({
        confirmed: balance,
      }),
    },
  } as any);

/**
 * mock `getBlockTransactionsById` of ergo node client
 * @param txs
 */
export const mockGetBlockTransactionsById = (
  txs: typeof testPartialTransactions | null = testPartialTransactions
) =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blocks: {
      getBlockTransactionsById: async () => ({
        transactions: txs,
      }),
    },
  } as any);

/**
 * mock `getBlockHeaderById` of ergo node client
 * @param txs
 */
export const mockGetBlockHeaderById = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blocks: {
      getBlockHeaderById: async () => testBlockHeaders,
    },
  } as any);

/**
 * mock `getTxById` and `getBlockTransactionsById` of ergo node client together
 * @param txs
 */
export const mockGetTxByIdAndGetBlockTransactionsById = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getTxById: async () => testTransaction,
    },
    blocks: {
      getBlockTransactionsById: async () => ({
        transactions: [testTransaction],
      }),
    },
  } as any);

/**
 * mock `sendTransactionAsBytes` of ergo node client
 */
export const mockSendTransactionAsBytes = () => {
  const sendTransactionAsBytesSpy = vi.fn();
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    transactions: {
      sendTransactionAsBytes: sendTransactionAsBytesSpy.mockResolvedValue(
        testTransaction.id
      ),
    },
  } as any);
  return sendTransactionAsBytesSpy;
};

/**
 * mock `getUnconfirmedTransactions` of ergo node client
 */
export const mockGetUnconfirmedTransactions = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    transactions: {
      getUnconfirmedTransactions: async ({
        offset,
        limit,
      }: {
        offset: bigint;
        limit: bigint;
      }) =>
        testMempoolTransactions.slice(Number(offset), Number(offset + limit)),
    },
  } as any);

/**
 * mock `getBoxesByAddressUnspent` of ergo node client
 */
export const mockGetBoxesByAddressUnspent = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getBoxesByAddressUnspent: async (
        address: string,
        { offset, limit }: { offset: bigint; limit: bigint }
      ) => testAddressBoxes.slice(Number(offset), Number(offset + limit)),
    },
  } as any);

/**
 * mock `getLastHeaders` of ergo node client
 */
export const mockGetLastHeaders = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blocks: {
      getLastHeaders: async () => testLastBlockHeaders,
    },
  } as any);

/**
 * mock `getBoxById` of ergo node client
 */
export const mockGetBoxById = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getBoxById: async () => testAddressBoxes[0],
    },
  } as any);

type ErgoNodeClientSchema = ReturnType<typeof ergoNodeClientFactory>;
/**
 * mock an api in a category to throw an error
 * @param category ergo node api category
 * @param apiName the name of the api in the category
 * @param objectToThrow
 */
export const mockApiToThrow = <Category extends keyof ErgoNodeClientSchema>(
  category: Category,
  apiName: keyof ErgoNodeClientSchema[Category],
  objectToThrow: {
    [key: string]: any;
  }
) =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    [category]: {
      [apiName]: vi.fn().mockRejectedValueOnce(objectToThrow),
    },
  } as any);
