import { describe, expect, it, vi } from 'vitest';

import { ErgoStateContext } from 'ergo-lib-wasm-nodejs';

import ErgoExplorerNetwork from '../lib/ErgoExplorerNetwork';

import {
  mockApiToThrow,
  mockGetApiV0TransactionsUnconfirmed,
  mockGetApiV1AddressesP1BalanceConfirmed,
  mockGetApiV1BlocksHeaders,
  mockGetApiV1BlocksP1,
  mockGetApiV1BoxesP1,
  mockGetApiV1BoxesUnspentByaddressP1,
  mockGetApiV1BoxesUnspentBytokenidP1,
  mockGetApiV1Networkstate,
  mockGetApiV1TransactionsP1,
  mockPostApiV0TransactionsSend,
} from './mocked/ErgoExplorerClient.mock';
import {
  testAddress,
  testAddressBalance,
  testAddressBalanceWithNoTokens,
  testAddressBoxes,
  testAddressBoxesBytes,
  testBlockHeader,
  testBlockId,
  testHeight,
  testMempoolTransactions,
  testPartialTransactions,
  testTokenIdBoxes,
  testTokenIdBoxesBytes,
  testTransaction,
  testTransactionBytes,
  testTransactionWithNullSpendingProof,
  testTransactionWithNullSpendingProofBytes,
} from './testData';

vi.mock('@rosen-clients/ergo-explorer');

const getNetwork = () =>
  new ErgoExplorerNetwork({
    explorerBaseUrl: 'https://test.explorer',
    extractorOptions: {
      lockAddress: testAddress,
      tokens: {
        idKeys: {},
        tokens: [],
      },
    },
  });

describe('ErgoExplorerNetwork', () => {
  describe('constructor', () => {
    /**
     * @target constructor of `ErgoExplorerNetwork` should set extractor
     * @dependencies
     * @scenario
     * - construct an `ErgoExplorerNetwork`
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
     * @target `ErgoExplorerNetwork.getHeight` should return current height
     * @dependencies
     * @scenario
     * - mock `getApiV1Networkstate` of ergo explorer client
     * @expected
     * - returned height should equal mocked height
     */
    it('should return current height', async () => {
      mockGetApiV1Networkstate();
      const network = getNetwork();

      const actualHeight = await network.getHeight();

      const expectedHeight = Number(testHeight);
      expect(actualHeight).toEqual(expectedHeight);
    });
  });

  describe('getTxConfirmation', () => {
    /**
     * @target `ErgoExplorerNetwork.getTxConfirmation` should return tx
     * confirmations
     * @dependencies
     * @scenario
     * - mock `getApiV1TransactionsP1` of ergo explorer client
     * @expected
     * - returned confirmations should equal mocked tx confirmations
     */
    it('should return tx confirmations', async () => {
      mockGetApiV1TransactionsP1();
      const network = getNetwork();

      const actualConfirmations = await network.getTxConfirmation(
        testTransaction.id
      );

      const expectedConfirmations = Number(testTransaction.numConfirmations);
      expect(actualConfirmations).toEqual(expectedConfirmations);
    });

    /**
     * @target `ErgoExplorerNetwork.getTxConfirmation` should return `-1` if tx
     * is not found in the blockchain
     * @dependencies
     * @scenario
     * - mock `getApiV1TransactionsP1` of ergo explorer client to reject with a
     *   404 error
     * @expected
     * - returned confirmations should equal -1
     */
    it('should return `-1` if tx is not found in the blockchain', async () => {
      mockApiToThrow('v1', 'getApiV1TransactionsP1', {
        response: {
          status: 404,
        },
      });
      const network = getNetwork();

      const actualConfirmations = await network.getTxConfirmation(
        testTransaction.id
      );

      const expectedConfirmations = -1;
      expect(actualConfirmations).toEqual(expectedConfirmations);
    });
  });

  describe('getAddressAssets', () => {
    /**
     * @target `ErgoExplorerNetwork.getAddressAssets` should return address
     * assets
     * @dependencies
     * @scenario
     * - mock `getApiV1AddressesP1BalanceConfirmed` of ergo explorer client
     * @expected
     * - returned assets should equal mocked assets
     */
    it('should return address assets', async () => {
      mockGetApiV1AddressesP1BalanceConfirmed();
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
     * @target `ErgoExplorerNetwork.getAddressAssets` should return address
     * assets when no `tokens` field is in api result
     * @dependencies
     * @scenario
     * - mock `getApiV1AddressesP1BalanceConfirmed` of ergo explorer client to
     *   return no `tokens` field in response
     * @expected
     * - returned assets should equal mocked assets
     */
    it('should return address assets', async () => {
      mockGetApiV1AddressesP1BalanceConfirmed(testAddressBalanceWithNoTokens);
      const network = getNetwork();

      const actualAssets = await network.getAddressAssets(testAddress);

      const expectedAssets = {
        nativeToken: testAddressBalanceWithNoTokens.nanoErgs,
        tokens: [],
      };
      expect(actualAssets).toEqual(expectedAssets);
    });
  });

  describe('getBlockTransactionIds', () => {
    /**
     * @target `ErgoExplorerNetwork.getBlockTransactionIds` should return block
     * transaction ids
     * @dependencies
     * @scenario
     * - mock `getApiV1BlocksP1` of ergo explorer client
     * @expected
     * - returned tx ids should equal mocked tx ids
     */
    it('should return block transaction ids', async () => {
      mockGetApiV1BlocksP1();
      const network = getNetwork();

      const actualTxIds = await network.getBlockTransactionIds(testBlockId);

      const expectedTxIds = testPartialTransactions.map((tx) => tx.id);
      expect(actualTxIds).toEqual(expectedTxIds);
    });

    /**
     * @target `ErgoExplorerNetwork.getBlockTransactionIds` should throw if no
     * `blockTransactions` is returned in api response
     * @dependencies
     * @scenario
     * - mock `getApiV1BlocksP1` of ergo explorer client with no
     *   `blockTransactions` field in the response available
     * @expected
     * - the function call should throw
     */
    it('should return block transaction ids', async () => {
      mockGetApiV1BlocksP1(null);
      const network = getNetwork();

      expect(
        async () => await network.getBlockTransactionIds(testBlockId)
      ).rejects.toThrow();
    });

    /**
     * @target `ErgoExplorerNetwork.getBlockTransactionIds` should return an
     * empty array if block is not found in the blockchain
     * @dependencies
     * @scenario
     * - mock `getApiV1BlocksP1` of ergo explorer client to reject with a 404
     *   error
     * @expected
     * - returned tx ids should be an empty array
     */
    it('should return an empty array if block is not found in the blockchain', async () => {
      mockApiToThrow('v1', 'getApiV1BlocksP1', {
        response: {
          status: 404,
        },
      });
      const network = getNetwork();

      const actualTxIds = await network.getBlockTransactionIds(testBlockId);

      const expectedTxIds: string[] = [];
      expect(actualTxIds).toEqual(expectedTxIds);
    });
  });

  describe('getBlockInfo', () => {
    /**
     * @target `ErgoExplorerNetwork.getBlockInfo` should return block info
     * @dependencies
     * @scenario
     * - mock `getApiV1BlocksP1` of ergo explorer client
     * @expected
     * - returned block info should equal mocked block info
     */
    it('should return block info', async () => {
      mockGetApiV1BlocksP1();
      const network = getNetwork();

      const actualBlockInfo = await network.getBlockInfo(testBlockId);

      const expectedBlockInfo = {
        hash: testBlockId,
        parentHash: testBlockHeader.parentId,
        height: Number(testBlockHeader.height),
      };
      expect(actualBlockInfo).toEqual(expectedBlockInfo);
    });
  });

  describe('getTransaction', () => {
    /**
     * @target `ErgoExplorerNetwork.getTransaction` should return transaction
     * bytes hex representation
     * @dependencies
     * @scenario
     * - mock `getApiV1TransactionsP1` of ergo explorer client
     * @expected
     * - returned tx bytes should equal mocked tx bytes
     */
    it('should return transaction bytes hex representation', async () => {
      mockGetApiV1TransactionsP1();
      const network = getNetwork();

      const actualBytes = await network.getTransaction(
        testTransaction.id,
        testTransaction.blockId
      );

      const expectedBytes = testTransactionBytes;
      expect(actualBytes).toEqual(expectedBytes);
    });

    /**
     * @target `ErgoExplorerNetwork.getTransaction` should return transaction
     * bytes hex representation if some tx inputs have `null` value for
     * `spendingProof`
     * @dependencies
     * @scenario
     * - mock `getApiV1TransactionsP1` of ergo explorer client with a tx
     *   containing `null` values for `spendingProof`
     * @expected
     * - returned tx bytes should equal mocked tx bytes
     */
    it('should return transaction bytes hex representation if some tx inputs have `null` value for `spendingProof`', async () => {
      mockGetApiV1TransactionsP1(testTransactionWithNullSpendingProof);
      const network = getNetwork();

      const actualBytes = await network.getTransaction(
        testTransaction.id,
        testTransaction.blockId
      );

      const expectedBytes = testTransactionWithNullSpendingProofBytes;
      expect(actualBytes).toEqual(expectedBytes);
    });

    /**
     * @target `ErgoExplorerNetwork.getTransaction` should return transaction
     * bytes hex representation if some tx inputs have `null` value for
     * `spendingProof`
     * @dependencies
     * @scenario
     * - mock `getApiV1TransactionsP1` of ergo explorer client
     * @expected
     * - api call should throw
     */
    it("should throw an error if transaction doesn't belong to the block", async () => {
      mockGetApiV1TransactionsP1();
      const network = getNetwork();

      expect(
        network.getTransaction(testTransaction.id, testBlockId)
      ).rejects.toThrow();
    });
  });

  describe('submitTransaction', () => {
    /**
     * @target `ErgoExplorerNetwork.submitTransaction` should submit transaction
     * @dependencies
     * @scenario
     * - mock `postApiV0TransactionsSend` of ergo explorer client
     * @expected
     * - `postApiV0TransactionsSend` of ergo explorer client should be called
     */
    it('should submit transaction', async () => {
      const sendTransactionAsBytesSpy = mockPostApiV0TransactionsSend();
      const network = getNetwork();

      await network.submitTransaction(testTransactionBytes);

      expect(sendTransactionAsBytesSpy).toHaveBeenCalled();
    });
  });

  describe('getMempoolTransactions', () => {
    /**
     * @target `ErgoExplorerNetwork.getMempoolTransactions` should return all
     * mempool transactions
     * @dependencies
     * @scenario
     * - mock `getApiV0TransactionsUnconfirmed` of ergo explorer client
     * @expected
     * - returned txs should equal mocked txs
     */
    it('should return all mempool transactions', async () => {
      mockGetApiV0TransactionsUnconfirmed();
      const network = getNetwork();

      const actualTxs = await network.getMempoolTransactions();

      const expectedTxs = testMempoolTransactions.map(
        () => testTransactionWithNullSpendingProofBytes
      );
      expect(actualTxs).toEqual(expectedTxs);
    });
  });

  describe('getAddressBoxes', () => {
    /**
     * @target `ErgoExplorerNetwork.getAddressBoxes` should return address boxes
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesUnspentByaddressP1` of ergo explorer client
     * @expected
     * - returned boxes bytes should equal mocked boxes bytes
     */
    it('should return address boxes', async () => {
      mockGetApiV1BoxesUnspentByaddressP1();
      const network = getNetwork();

      const actualBoxesBytes = await network.getAddressBoxes(
        testAddress,
        0,
        10
      );

      const expectedBoxesBytes = testAddressBoxesBytes;
      expect(actualBoxesBytes).toEqual(expectedBoxesBytes);
    });

    /**
     * @target `ErgoExplorerNetwork.getAddressBoxes` should return an empty
     * array if api response contains no `items` field
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesUnspentByaddressP1` of ergo explorer client to
     *   return no `items` field
     * @expected
     * - returned boxes bytes should equal and empty array
     */
    it('should return an empty array if api response contains no `items` field', async () => {
      mockGetApiV1BoxesUnspentByaddressP1(false);
      const network = getNetwork();

      const actualBoxesBytes = await network.getAddressBoxes(
        testAddress,
        0,
        10
      );

      const expectedBoxesBytes: string[] = [];
      expect(actualBoxesBytes).toEqual(expectedBoxesBytes);
    });
  });

  describe('getBoxesByTokenId', () => {
    /**
     * @target `ErgoExplorerNetwork.getBoxesByTokenId` should return boxes by
     * token id
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesUnspentBytokenidP1` of ergo explorer client
     * @expected
     * - returned boxes bytes should equal mocked boxes bytes
     */
    it('should return boxes by token id', async () => {
      mockGetApiV1BoxesUnspentBytokenidP1();
      const network = getNetwork();
      const testTokenId = testTokenIdBoxes[0].assets[0].tokenId;

      const actualBoxesBytes = await network.getBoxesByTokenId(
        testTokenId,
        testAddress,
        0,
        10
      );

      const expectedBoxesBytes = testTokenIdBoxesBytes;
      expect(actualBoxesBytes).toEqual(expectedBoxesBytes);
    });

    /**
     * @target `ErgoExplorerNetwork.getBoxesByTokenId` should return an empty
     * array if api response contains no `items` field
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesUnspentBytokenidP1` of ergo explorer client to
     *   return no `items` field
     * @expected
     * - returned boxes bytes should equal and empty array
     */
    it('should return an empty array if api response contains no `items` field', async () => {
      mockGetApiV1BoxesUnspentBytokenidP1(false);
      const network = getNetwork();
      const testTokenId = testTokenIdBoxes[0].assets[0].tokenId;

      const actualBoxesBytes = await network.getBoxesByTokenId(
        testTokenId,
        testAddress,
        0,
        10
      );

      const expectedBoxesBytes: string[] = [];
      expect(actualBoxesBytes).toEqual(expectedBoxesBytes);
    });
  });

  describe('getStateContext', () => {
    /**
     * @target `ErgoExplorerNetwork.getStateContext` should get state context
     * @dependencies
     * @scenario
     * - mock `getApiV1BlocksHeaders` of ergo explorer client
     * @expected
     * - returned state context should be a valid one
     */
    it('should get state context', async () => {
      mockGetApiV1BlocksHeaders();
      const network = getNetwork();

      const actualStateContext = await network.getStateContext();

      expect(actualStateContext).toBeInstanceOf(ErgoStateContext);
    });
  });

  describe('isBoxUnspentAndValid', () => {
    /**
     * @target `ErgoExplorerNetwork.isBoxUnspentAndValid` should check if box is
     * unspent and valid
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesP1` of ergo explorer client
     * @expected
     * - should return true
     */
    it('should check if box is unspent and valid', async () => {
      mockGetApiV1BoxesP1();
      const network = getNetwork();

      const actualIsValid = await network.isBoxUnspentAndValid(
        testAddressBoxes[0].boxId
      );

      expect(actualIsValid).toEqual(true);
    });

    /**
     * @target `ErgoExplorerNetwork.isBoxUnspentAndValid` should return `false`
     * if box is not found in the blockchain
     * @dependencies
     * @scenario
     * - mock `getApiV1BoxesP1` of ergo explorer client to reject with a 404
     *   error
     * @expected
     * - should return false
     */
    it('should return `false` if box is not found in the blockchain', async () => {
      mockApiToThrow('v1', 'getApiV1BoxesP1', {
        response: {
          status: 404,
        },
      });
      const network = getNetwork();

      const actualIsValid = await network.isBoxUnspentAndValid(
        testAddressBoxes[0].boxId
      );

      expect(actualIsValid).toEqual(false);
    });
  });
});
