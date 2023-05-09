import { describe, expect, it, vi } from 'vitest';

import ErgoNodeNetwork from '../lib/ErgoNodeNetwork';

import {
  mockGetAddressBalanceTotal,
  mockGetBlockHeaderById,
  mockGetBlockTransactionsById,
  mockGetBoxById,
  mockGetBoxesByAddressUnspent,
  mockGetLastHeaders,
  mockGetNodeInfo,
  mockGetTxById,
  mockGetTxByIdAndGetBlockTransactionsById,
  mockGetUnconfirmedTransactions,
  mockSendTransactionAsBytes,
} from './mocked/ErgoNodeClient.mock';

import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';
import {
  testAddress,
  testAddressBalance,
  testAddressBalanceWithInvalidTokens,
  testAddressBoxes,
  testAddressBoxesBytes,
  testBlockHeaders,
  testBlockId,
  testHeight,
  testMempoolTransactions,
  testPartialTransactions,
  testPartialTransactionsWithAbsentIds,
  testTransaction,
  testTransactionBytes,
} from './testData';

vi.mock('@rosen-clients/ergo-node');

const getNetwork = () =>
  new ErgoNodeNetwork({
    nodeBaseUrl: 'https://test.node',
    extractorOptions: {
      lockAddress: testAddress,
      tokens: {
        idKeys: {},
        tokens: [],
      },
    },
  });

describe('ErgoNodeNetwork', () => {
  describe('constructor', () => {
    /**
     * @target constructor of `ErgoNodeNetwork` should set extractor
     * @dependencies
     * @scenario
     * - construct an `ErgoNodeNetwork`
     * @expected
     * - extractor of network should be defined
     */
    it('should set extractor', () => {
      const network = getNetwork();

      expect(network.extractor).toBeDefined();
    });
  });

  describe('getHeight', () => {
    /**
     * @target `ErgoNodeNetwork.getHeight` should return current height
     * @dependencies
     * @scenario
     * - mock `getNodeInfo` of ergo node client
     * @expected
     * - returned height should equal mocked height
     */
    it('should return current height', async () => {
      mockGetNodeInfo();
      const network = getNetwork();

      const actualHeight = await network.getHeight();

      const expectedHeight = Number(testHeight);
      expect(actualHeight).toEqual(expectedHeight);
    });
  });

  describe('getTxConfirmation', () => {
    /**
     * @target `ErgoNodeNetwork.getTxConfirmation` should return tx confirmations
     * @dependencies
     * @scenario
     * - mock `getTxById` of ergo node client
     * @expected
     * - returned confirmations should equal mocked tx confirmations
     */
    it('should return tx confirmations', async () => {
      mockGetTxById();
      const network = getNetwork();

      const actualConfirmations = await network.getTxConfirmation(
        testTransaction.id
      );

      const expectedConfirmations = Number(testTransaction.numConfirmations);
      expect(actualConfirmations).toEqual(expectedConfirmations);
    });
  });

  describe('getAddressAssets', () => {
    /**
     * @target `ErgoNodeNetwork.getAddressAssets` should return address assets
     * @dependencies
     * @scenario
     * - mock `getAddressBalanceTotal` of ergo node client
     * @expected
     * - returned assets should equal mocked assets
     */
    it('should return address assets', async () => {
      mockGetAddressBalanceTotal();
      const network = getNetwork();

      const actualAssets = await network.getAddressAssets(testAddress);

      const expectedAssets = {
        nativeToken: testAddressBalance.nanoErgs,
        tokens: testAddressBalance.tokens.map((token) => ({
          id: token.tokenId,
          value: token.amount,
        })),
      };
      expect(actualAssets).toEqual(expectedAssets);
    });

    /**
     * @target `ErgoNodeNetwork.getAddressAssets` should return zero assets if
     * no confirmed field is present in api result
     * @dependencies
     * @scenario
     * - mock `getAddressBalanceTotal` of ergo node client to return an object
     *   with no `confirmed` field
     * @expected
     * - returned assets should be all zero
     */
    it('should return zero assets if no confirmed field is present in api result', async () => {
      mockGetAddressBalanceTotal(null);
      const network = getNetwork();

      const actualAssets = await network.getAddressAssets(testAddress);

      const expectedAssets = {
        nativeToken: 0n,
        tokens: [],
      };
      expect(actualAssets).toEqual(expectedAssets);
    });

    /**
     * @target `ErgoNodeNetwork.getAddressAssets` should ignore tokens without a
     * `tokenId` or `amount` field
     * @dependencies
     * @scenario
     * - mock `getAddressBalanceTotal` of ergo node client to an object
     *   containing invalid tokens
     * @expected
     * - returned assets should be an array omiting invalid tokens
     */
    it('should ignore tokens without a `tokenId` or `amount` field', async () => {
      mockGetAddressBalanceTotal(testAddressBalanceWithInvalidTokens as any);
      const network = getNetwork();

      const actualAssets = await network.getAddressAssets(testAddress);

      const expectedAssets = {
        nativeToken: testAddressBalanceWithInvalidTokens.nanoErgs,
        tokens: testAddressBalanceWithInvalidTokens.tokens
          .filter((token) => token.amount && token.tokenId)
          .map((token) => ({
            id: token.tokenId,
            value: token.amount,
          })),
      };
      expect(actualAssets).toEqual(expectedAssets);
    });
  });

  describe('getBlockTransactionIds', () => {
    /**
     * @target `ErgoNodeNetwork.getBlockTransactionIds` should return block
     * transaction ids
     * @dependencies
     * @scenario
     * - mock `getBlockTransactionsById` of ergo node client
     * @expected
     * - returned tx ids should equal mocked tx ids
     */
    it('should return block transaction ids', async () => {
      mockGetBlockTransactionsById();
      const network = getNetwork();

      const actualTxIds = await network.getBlockTransactionIds(testBlockId);

      const expectedTxIds = testPartialTransactions.map((tx) => tx.id);
      expect(actualTxIds).toEqual(expectedTxIds);
    });

    /**
     * @target `ErgoNodeNetwork.getBlockTransactionIds` should throw an error if
     * some transaction ids are undefined
     * @dependencies
     * @scenario
     * - mock `getBlockTransactionsById` of ergo node client with some invalid
     *   txs
     * @expected
     * - the method should throw
     */
    it('should throw an error if some transaction ids are undefined', async () => {
      mockGetBlockTransactionsById(testPartialTransactionsWithAbsentIds as any);
      const network = getNetwork();

      expect(() =>
        network.getBlockTransactionIds(testBlockId)
      ).rejects.toThrow();
    });
  });

  describe('getBlockInfo', () => {
    /**
     * @target `ErgoNodeNetwork.getBlockInfo` should return block info
     * @dependencies
     * @scenario
     * - mock `getBlockHeaderById` of ergo node client
     * @expected
     * - returned block info should equal mocked block info
     */
    it('should return block info', async () => {
      mockGetBlockHeaderById();
      const network = getNetwork();

      const actualInfo = await network.getBlockInfo(testBlockId);

      const expectedInfo = {
        hash: testBlockId,
        parentHash: testBlockHeaders.parentId,
        height: Number(testBlockHeaders.height),
      };
      expect(actualInfo).toEqual(expectedInfo);
    });
  });

  describe('getTransaction', () => {
    /**
     * @target `ErgoNodeNetwork.getTransaction` should return transaction bytes
     * hex representation
     * @dependencies
     * @scenario
     * - mock `getTxById` and `getBlockTransactionsById` of ergo node client
     * @expected
     * - returned tx bytes should equal mocked tx bytes
     */
    it('should return transaction bytes hex representation', async () => {
      mockGetTxByIdAndGetBlockTransactionsById();
      const network = getNetwork();

      const actualBytes = await network.getTransaction(testTransaction.id);

      const expectedBytes = testTransactionBytes;
      expect(actualBytes).toEqual(expectedBytes);
    });
  });

  describe('submitTransaction', () => {
    /**
     * @target `ErgoNodeNetwork.submitTransaction` should submit transaction
     * @dependencies
     * @scenario
     * - mock `sendTransactionAsBytes` of ergo node client
     * @expected
     * - `sendTransactionAsBytes` of ergo node client should be called with
     *   correct arguments
     */
    it('should submit transaction', async () => {
      const sendTransactionAsBytesSpy = mockSendTransactionAsBytes();
      const network = getNetwork();

      await network.submitTransaction(testTransactionBytes);

      expect(sendTransactionAsBytesSpy).toHaveBeenCalledWith(
        testTransactionBytes
      );
    });
  });

  describe('getMempoolTransactions', () => {
    /**
     * @target `ErgoNodeNetwork.getMempoolTransactions` should return all
     * mempool transactions
     * @dependencies
     * @scenario
     * - mock `getUnconfirmedTransactions` of ergo node client
     * @expected
     * - returned txs should equal mocked txs
     */
    it('should return all mempool transactions', async () => {
      mockGetUnconfirmedTransactions();
      const network = getNetwork();

      const actualTxs = await network.getMempoolTransactions();

      const expectedTxs = testMempoolTransactions.map(
        () => testTransactionBytes
      );
      expect(actualTxs).toEqual(expectedTxs);
    });
  });

  describe('getAddressBoxes', () => {
    /**
     * @target `ErgoNodeNetwork.getAddressBoxes` should return address boxes
     * @dependencies
     * @scenario
     * - mock `getBoxesByAddressUnspent` of ergo node client
     * @expected
     * - returned box bytes should equal mocked box bytes
     */
    it('should return address boxes', async () => {
      mockGetBoxesByAddressUnspent();
      const network = getNetwork();

      const actualBoxBytes = await network.getAddressBoxes(testAddress, 0, 5);

      const expectedBoxBytes = testAddressBoxesBytes.slice(0, 5);
      expect(actualBoxBytes).toEqual(expectedBoxBytes);
    });
  });

  describe('getBoxesByTokenId', () => {
    /**
     * @target `ErgoNodeNetwork.getBoxesByTokenId` should return address boxes
     * by token id
     * @dependencies
     * @scenario
     * - mock `getBoxesByAddressUnspent` of ergo node client
     * @expected
     * - returned box bytes should equal mocked box bytes
     */
    it('should return address boxes by token id', async () => {
      mockGetBoxesByAddressUnspent();
      const network = getNetwork();
      const testTokenId = testAddressBoxes[0].assets[0].tokenId;

      const actualBoxBytes = await network.getBoxesByTokenId(
        testTokenId,
        testAddress,
        0,
        5
      );

      const expectedBoxBytes = testAddressBoxes
        .reduce(
          (boxBytes, box, index) =>
            box.assets.some((asset) => asset.tokenId === testTokenId)
              ? [...boxBytes, testAddressBoxesBytes[index]]
              : boxBytes,
          [] as string[]
        )
        .slice(0, 5);

      expect(actualBoxBytes).toEqual(expectedBoxBytes);
    });
  });

  describe('getStateContext', () => {
    /**
     * @target `ErgoNodeNetwork.getStateContext` should get state context
     * @dependencies
     * @scenario
     * - mock `getLastHeaders` of ergo node client
     * @expected
     * - returned state context should be a valid one
     */
    it('should get state context', async () => {
      mockGetLastHeaders();
      const network = getNetwork();

      const actualStateContext = await network.getStateContext();

      expect(actualStateContext).toBeInstanceOf(ErgoStateContext);
    });
  });

  describe('isBoxUnspentAndValid', () => {
    /**
     * @target `ErgoNodeNetwork.isBoxUnspentAndValid` should check if box is
     * unspent and valid
     * @dependencies
     * @scenario
     * - mock `getBoxById` of ergo node client
     * @expected
     * - should return true
     */
    it('should check if box is unspent and valid', async () => {
      mockGetBoxById();
      const network = getNetwork();

      const actualIsValid = await network.isBoxUnspentAndValid(
        testAddressBoxes[0].boxId
      );

      expect(actualIsValid).toEqual(true);
    });
  });
});
