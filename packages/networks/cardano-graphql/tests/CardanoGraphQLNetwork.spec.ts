import { vi } from 'vitest';
import * as testData from './testData';
import { TestCardanoGraphQLNetwork } from './TestCardanoGraphQLNetwork';
import { FailedError } from '@rosen-chains/abstract-chain';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core';

describe('CardanoGraphQLNetwork', () => {
  const mockQueryResult = (
    client: ApolloClient<NormalizedCacheObject>,
    result: any
  ) => {
    vi.spyOn(client, 'query').mockResolvedValue(result);
  };

  const mockNetwork = () =>
    new TestCardanoGraphQLNetwork('testProjectId', 'lockAddress', {
      idKeys: {},
      tokens: [],
    });

  describe('constructor', () => {
    /**
     * @target constructor of `CardanoGraphQLNetwork` should set extractor
     * @dependencies
     * @scenario
     * - construct an `CardanoGraphQLNetwork`
     * @expected
     * - extractor of network should be defined
     */
    it('should set extractor', () => {
      const network = mockNetwork();

      expect(network.extractor).toBeDefined();
    });
  });

  describe('getHeight', () => {
    /**
     * @target `CardanoGraphQLNetwork.getHeight` should return block height successfully
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked block height
     */
    it('should return block height successfully', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.networkTipResult);

      // run test
      const result = await network.getHeight();

      // check returned value
      expect(result).toEqual(testData.blockHeight);
    });
  });

  describe('getTxConfirmation', () => {
    /**
     * @target `CardanoGraphQLNetwork.getTxConfirmation` should return tx confirmation
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked tx confirmation
     */
    it('should return tx confirmation', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.txBlockInfoResult);

      // run test
      const result = await network.getTxConfirmation(testData.txId);

      // check returned value
      expect(result).toEqual(testData.txConfirmation);
    });

    /**
     * @target `CardanoGraphQLNetwork.getTxConfirmation` should return -1
     * when transaction is not found
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be -1
     */
    it('should return -1 when transaction is not found', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.notFoundTxBlockInfoResult);

      // run test
      const result = await network.getTxConfirmation(testData.txId);

      // check returned value
      expect(result).toEqual(-1);
    });
  });

  describe('getAddressAssets', () => {
    /**
     * @target `CardanoGraphQLNetwork.getAddressAssets` should return address assets
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked assets
     */
    it('should return address assets', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.addressAssetsResult);

      // run test
      const result = await network.getAddressAssets(testData.address);

      // check returned value
      expect(result).toEqual(testData.addressAssets);
    });

    /**
     * @target `CardanoGraphQLNetwork.getAddressAssets` should return address assets
     * even when address has no assets
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked assets
     */
    it('should return address assets even when address has no assets', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.emptyAddressAssetsResult);

      // run test
      const result = await network.getAddressAssets(testData.address);

      // check returned value
      expect(result).toEqual({
        nativeToken: 0n,
        tokens: [],
      });
    });
  });

  describe('getBlockTransactionIds', () => {
    /**
     * @target `CardanoGraphQLNetwork.getBlockTransactionIds` should return
     * id of block transactions
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked transaction hashes
     */
    it('should return id of block transactions', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.blockTxIdsResult);

      // run test
      const result = await network.getBlockTransactionIds(testData.blockId);

      // check returned value
      expect(result).toEqual(testData.blockTxIds);
    });
  });

  describe('getBlockInfo', () => {
    /**
     * @target `CardanoGraphQLNetwork.getBlockInfo` should return
     * block hash, parent hash and height
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked block info
     */
    it('should return block hash, parent hash and height', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.blockInfoResult);

      // run test
      const result = await network.getBlockInfo(testData.blockId);

      // check returned value
      expect(result).toEqual(testData.blockInfo);
    });
  });

  describe('getTransaction', () => {
    /**
     * @target `CardanoGraphQLNetwork.getTransaction` should return transaction
     * with no metadata
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked transaction
     */
    it('should return transaction with no metadata', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(
        network.getClient(),
        testData.noMetadataGetTransactionResult
      );

      // run test
      const result = await network.getTransaction(
        testData.txId,
        testData.blockId
      );
      // check returned value
      expect(result).toEqual(testData.noMetadataTx);
    });

    /**
     * @target `CardanoGraphQLNetwork.getTransaction` should return transaction
     * with rosen metadata
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked transaction
     */
    it('should return transaction with rosen metadata', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(
        network.getClient(),
        testData.rosenMetadataGetTransactionResult
      );

      // run test
      const result = await network.getTransaction(
        testData.txId,
        testData.blockId
      );
      // check returned value
      expect(result).toEqual(testData.rosenMetadataTx);
    });

    /**
     * @target `CardanoGraphQLNetwork.getTransaction` should return transaction
     * with string metadata
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked transaction
     */
    it('should return transaction with string metadata', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(
        network.getClient(),
        testData.stringMetadataGetTransactionResult
      );

      // run test
      const result = await network.getTransaction(
        testData.txId,
        testData.blockId
      );
      // check returned value
      expect(result).toEqual(testData.stringMetadataTx);
    });
  });

  describe('getAddressBoxes', () => {
    /**
     * @target `CardanoGraphQLNetwork.getAddressBoxes` should return address Utxos
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked utxos
     */
    it('should return address Utxos', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.addressUtxosResult);

      // run test
      const result = await network.getAddressBoxes(testData.address, 0, 100);

      // check returned value
      expect(result).toEqual(testData.addressUtxos);
    });

    /**
     * @target `CardanoGraphQLNetwork.getAddressBoxes` should return empty
     * list when address has no boxes
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be empty list
     */
    it('should return empty list when address has no boxes', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.noUtxoAddressUtxosResult);

      // run test
      const result = await network.getAddressBoxes(testData.address, 0, 100);

      // check returned value
      expect(result).toEqual([]);
    });
  });

  describe('isBoxUnspentAndValid', () => {
    /**
     * @target `CardanoGraphQLNetwork.isBoxUnspentAndValid` should return true
     * when box is unspent and valid
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be true
     */
    it('should return true when box is unspent and valid', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.addressUtxosResult);

      // run test
      const result = await network.isBoxUnspentAndValid(testData.boxId);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target `CardanoGraphQLNetwork.isBoxUnspentAndValid` should return false
     * when box is spent
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be false
     */
    it('should return false when box is spent', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.notFoundUtxoResult);

      // run test
      const result = await network.isBoxUnspentAndValid(testData.boxId);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('currentSlot', () => {
    /**
     * @target `CardanoGraphQLNetwork.currentSlot` should return current slot successfully
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked current slot
     */
    it('should return current slot successfully', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.networkTipResult);

      // run test
      const result = await network.currentSlot();

      // check returned value
      expect(result).toEqual(testData.absoluteSlot);
    });
  });

  describe('getUtxo', () => {
    /**
     * @target `CardanoGraphQLNetwork.getUtxo` should return utxo successfully
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be true
     */
    it('should return utxo successfully', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.addressUtxosResult);

      // run test
      const result = await network.getUtxo(testData.boxId);

      // check returned value
      expect(result).toEqual(testData.utxo);
    });

    /**
     * @target `CardanoGraphQLNetwork.getUtxo` should throw Error
     * when box tx is not found
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - call the function and expect error
     * @expected
     * - it should throw FailedError
     */
    it('should throw Error when box tx is not found', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.notFoundUtxoResult);

      // call the function and expect error
      await expect(async () => {
        await network.getUtxo(testData.boxId);
      }).rejects.toThrow(FailedError);
    });
  });

  describe('getProtocolParameters', () => {
    /**
     * @target `CardanoGraphQLNetwork.getProtocolParameters` should return required parameters
     * @dependencies
     * @scenario
     * - mock ApolloClient query result
     * - run test
     * - check returned value
     * @expected
     * - it should be mocked slot
     */
    it('should return required parameters', async () => {
      // mock client response
      const network = mockNetwork();
      mockQueryResult(network.getClient(), testData.protocolParamsResult);

      // run test
      const result = await network.getProtocolParameters();

      // check returned value
      expect(result).toEqual(testData.requiredProtocolParams);
    });
  });
});
