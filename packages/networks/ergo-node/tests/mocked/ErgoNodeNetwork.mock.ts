import ergoNodeClientFactory from '@rosen-clients/ergo-node';
import { vi } from 'vitest';

import {
  testAddressBalance,
  testHeight,
  testMempoolTransactions,
  testPartialTransactions,
  testTransaction,
} from '../testData';

/**
 * mock `getHeight` of ergo node client
 */
export const mockGetHeight = () =>
  vi.mocked(ergoNodeClientFactory).mockReturnValueOnce({
    blockchain: {
      getIndexedHeight: async () => ({
        indexedHeight: BigInt(testHeight),
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
