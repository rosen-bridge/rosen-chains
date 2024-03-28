import { expect } from 'vitest';
import TestEvmNetwork from './network/TestEvmNetwork';
import * as TestData from './testData';
import { vi } from 'vitest';

import {
  AssetNotSupportedError,
  MaxParallelTxError,
  NotEnoughAssetsError,
  PaymentTransaction,
  SigningStatus,
  TransactionFormatError,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import * as testUtils from './TestUtils';
import TestChain from './TestChain';
import Serializer from '../lib/Serializer';
import { Transaction, TransactionLike } from 'ethers';

describe('EvmChain', () => {
  const network = new TestEvmNetwork();
  const feeRatioDivisor = 1n;

  const generateChainObject = (
    network: TestEvmNetwork,
    signFn: (txHash: Uint8Array) => Promise<string> = testUtils.mockedSignFn
  ) => {
    return new TestChain(
      network,
      testUtils.configs,
      feeRatioDivisor,
      {
        idKeys: {},
        tokens: [],
      },
      'eth',
      TestData.supportedTokens,
      signFn
    );
  };
  const evmChain = generateChainObject(network);

  describe('generateMultipleTransactions', () => {
    /**
     * @target EvmChain.generateMultipleTransactions should generate payment transactions
     * successfully for multiple orders
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets, getMaxFeePerGas
     * - mock getGasRequiredERC20Transfer, getAddressNextNonce
     * - mock getMaxPriorityFeePerGas
     * - call the function
     * - check returned value
     * @expected
     * - PaymentTransactions txType, eventId and network should be as
     *   expected
     * - extracted order of generated transactions should be the same as input
     *   orders
     * - eventId should be properly encoded at the end of the transactions' data
     * - no extra data should be found in the transactions' data
     * - transactions must be of type 2 and has no blobs
     * - nonces must be in sequential order starting from next available nonce
     */
    it('should generate payment transactions successfully for multiple orders', async () => {
      const orders = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const nonce = 53;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetMaxFeePerGas(network, 10n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetAddressNextAvailableNonce(network, nonce);
      testUtils.mockGetMaxPriorityFeePerGas(network, 10n);

      // run test
      const evmTxs = await evmChain.generateMultipleTransactions(
        eventId,
        txType,
        orders,
        [],
        []
      );

      // check returned value
      const splittedOrders = TestData.splittedOrders;
      for (let index = 0; index < evmTxs.length; index++) {
        const evmTx = evmTxs[index];
        const order = splittedOrders[index];

        expect(evmTx.txType).toEqual(txType);
        expect(evmTx.eventId).toEqual(eventId);
        expect(evmTx.network).toEqual(evmChain.CHAIN);

        // extracted order of generated transaction should be the same as input order
        const extractedOrder = evmChain.extractTransactionOrder(evmTx);
        expect(extractedOrder).toEqual(order);

        // check eventId encoded at the end of the data
        const tx = Serializer.deserialize(evmTx.txBytes);
        expect(tx.data.substring(tx.data.length - 32)).toEqual(eventId);

        // check there is no more data
        if (order[0].assets.nativeToken != 0n)
          expect(tx.data.length).toEqual(34);
        else expect(tx.data.length).toEqual(170);

        // check transaction type
        expect(tx.type).toEqual(2);

        // check blobs zero
        expect(tx.maxFeePerBlobGas).toEqual(null);

        // check nonce
        expect(tx.nonce).toEqual(nonce + index);
      }
    });

    /**
     * @target EvmChain.generateMultipleTransactions should generate payment
     * transaction successfully for single order
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets, getMaxFeePerGas
     * - mock getGasRequiredNativeTransfer, getAddressNextNonce
     * - mock getMaxPriorityFeePerGas
     * - call the function
     * - check returned value
     * @expected
     * - PaymentTransaction txType, eventId and network should be as
     *   expected
     * - extracted order of generated transaction should be the same as input
     *   order
     * - eventId should be properly in the transaction data
     * - no extra data should be found in the transaction data
     * - transaction must be of type 2 and has no blobs
     * - nonce must be the same as the next available nonce
     */
    it('should generate payment transaction successfully for single order', async () => {
      const order = TestData.nativePaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const nonce = 49;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetMaxFeePerGas(network, 10n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetAddressNextAvailableNonce(network, nonce);
      testUtils.mockGetMaxPriorityFeePerGas(network, 10n);

      // run test
      const evmTx = await evmChain.generateMultipleTransactions(
        eventId,
        txType,
        order,
        [],
        []
      );

      // check returned value
      expect(evmTx[0].txType).toEqual(txType);
      expect(evmTx[0].eventId).toEqual(eventId);
      expect(evmTx[0].network).toEqual(evmChain.CHAIN);

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = evmChain.extractTransactionOrder(evmTx[0]);
      expect(extractedOrder).toEqual(order);

      const tx = Serializer.deserialize(evmTx[0].txBytes);

      // check eventId encoded at the end of the data
      expect(tx.data.substring(2, 34)).toEqual(eventId);

      // check there is no more data
      expect(tx.data.length).toEqual(34);

      // check transaction type
      expect(tx.type).toEqual(2);

      // check blobs zero
      expect(tx.maxFeePerBlobGas).toEqual(null);

      // check nonce
      expect(tx.nonce).toEqual(nonce);
    });

    /**
     * @target EvmChain.generateMultipleTransactions should throw error
     * when token id is not supported
     * @dependencies
     * @scenario
     * - mock PaymentOrder
     * - call the function
     * @expected
     * - throw AssetNotSupportedError
     */
    it('should throw error when when token id is not supported', async () => {
      const orders = structuredClone(TestData.multipleOrders);
      orders[0].assets.tokens[0].id =
        '0x12345672e5a2f595151c94762fb38e5730357785';
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      // run test and expect error
      await expect(async () => {
        await evmChain.generateMultipleTransactions(
          eventId,
          txType,
          orders,
          [],
          []
        );
      }).rejects.toThrow(AssetNotSupportedError);
    });

    /**
     * @target EvmChain.generateMultipleTransactions should throw error
     * when lock address does not have enough assets
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets
     * - call the function
     * @expected
     * - throw NotEnoughAssetsError
     */
    it('should throw error when lock address does not have enough assets', async () => {
      const order = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;

      // mock hasLockAddressEnoughAssets
      testUtils.mockHasLockAddressEnoughAssets(evmChain, false);

      // run test and expect error
      await expect(async () => {
        await evmChain.generateMultipleTransactions(
          eventId,
          txType,
          order,
          [],
          []
        );
      }).rejects.toThrow(NotEnoughAssetsError);
    });

    /**
     * @target EvmChain.generateMultipleTransactions should throw error
     * when next available nonce was already used for maximum allowed times
     * @dependencies
     * @scenario
     * - fill the unsigned and signed transactions lists with mock data
     * - mock hasLockAddressEnoughAssets and getAddressNextNonce
     * - call the function
     * @expected
     * - throw MaxParallelTxError
     */
    it('should throw error when next available nonce was already used for maximum allowed times', async () => {
      const order = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const unsigned = TestData.paralelTransactions.map((elem) => {
        elem = elem.clone();
        elem.signature = null;
        return new PaymentTransaction(
          'test',
          elem.unsignedHash,
          eventId,
          Serializer.serialize(elem),
          txType
        );
      });
      const signed = TestData.paralelTransactions.map((elem) =>
        Buffer.from(Serializer.signedSerialize(elem)).toString('hex')
      );

      // mock hasLockAddressEnoughAssets, getAddressNextNonce,
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetAddressNextAvailableNonce(network, 53);

      // run test and expect error
      await expect(async () => {
        await evmChain.generateMultipleTransactions(
          eventId,
          txType,
          order,
          unsigned,
          signed
        );
      }).rejects.toThrow(MaxParallelTxError);
    });

    /**
     * @target EvmChain.generateMultipleTransactions should not throw error
     * when next available nonce is not yet used for maximum allowed times
     * @dependencies
     * @scenario
     * - fill the unsigned and signed transactions lists with mock data
     * - mock hasLockAddressEnoughAssets and getAddressNextNonce
     * - call the function
     * @expected
     * - no error
     */
    it('should not throw error when next available nonce is not yet used for maximum allowed times', async () => {
      const order = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const unsigned = TestData.paralelTransactions.map((elem) => {
        elem = elem.clone();
        elem.signature = null;
        return new PaymentTransaction(
          'test',
          elem.unsignedHash,
          eventId,
          Serializer.serialize(elem),
          txType
        );
      });
      const signed = TestData.paralelTransactions.map((elem) =>
        Buffer.from(Serializer.signedSerialize(elem)).toString('hex')
      );

      // mock hasLockAddressEnoughAssets, getAddressNextNonce,
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetAddressNextAvailableNonce(network, 53);

      // run test and expect no error
      evmChain.configs.maxParallelTx = 12;
      await expect(async () => {
        await evmChain.generateMultipleTransactions(
          eventId,
          txType,
          order,
          [unsigned[0], unsigned[1]],
          [signed[0], signed[1]]
        );
      }).not.rejects;
    });
  });

  describe('rawTxToPaymentTransaction', () => {
    /**
     * @target EvmChain.rawTxToPaymentTransaction should construct transaction successfully
     * @dependencies
     * @scenario
     * - mock a network object
     *   - mock 'getHeight'
     *   - mock 'getStateContext'
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should construct transaction successfully', async () => {
      const result = await evmChain.rawTxToPaymentTransaction(
        TestData.transaction0JsonString
      );

      // run test
      expect(result.toJson()).toEqual(
        TestData.transaction0PaymentTransaction.toJson()
      );
    });

    /**
     * @target EvmChain.rawTxToPaymentTransaction should throw error when transaction
     * is not of type 2
     * @dependencies
     * @scenario
     * - mock invalid transaction
     * - run test
     * @expected
     * - throw TransactionFormatError
     */
    it('should throw error when transaction is not of type 2', async () => {
      expect(async () => {
        await evmChain.rawTxToPaymentTransaction(
          TestData.transaction1JsonString
        );
      }).rejects.toThrow(TransactionFormatError);
    });
  });

  describe('getTransactionAssets', () => {
    /**
     * @target EvmChain.getTransactionAssets should get transaction assets
     * successfully when there is ERC-20 token transfer.
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction assets (both input and output assets)
     */
    it('should get transaction assets successfully when there is ERC-20 token transfer.', async () => {
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.getTransactionAssets(paymentTx);

      // check returned value
      expect(result.inputAssets).toEqual(TestData.transaction1Assets);
      expect(result.outputAssets).toEqual(TestData.transaction1Assets);
    });

    /**
     * @target EvmChain.getTransactionAssets should get transaction assets
     * successfully when there is only native-token transfer.
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction assets (both input and output assets)
     */
    it('should get transaction assets successfully when there is only native-token transfer', async () => {
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1Json };
      trx.data = '0x';
      const tx = Transaction.from(trx);
      const assets = { ...TestData.transaction1Assets };
      assets.tokens = [];
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // check returned value
      const result = await evmChain.getTransactionAssets(paymentTx);

      // check returned value
      expect(result.inputAssets).toEqual(assets);
      expect(result.outputAssets).toEqual(assets);
    });

    /**
     * @target EvmChain.getTransactionAssets should throw error when `to` is null
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * @expected
     * - throw error
     */
    it('should throw error when `to` is null', async () => {
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1Json };
      trx.data = '0x';
      const tx = Transaction.from(trx);
      const assets = { ...TestData.transaction1Assets };
      assets.tokens = [];
      tx.to = null;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test function and expect error
      expect(async () => {
        await evmChain.getTransactionAssets(paymentTx);
      }).rejects.toThrowError(TransactionFormatError);
    });

    /**
     * @target EvmChain.getTransactionAssets should throw error when transaction is not of type 2
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * @expected
     * - throw error
     */
    it('should throw error when transaction is not of type 2', async () => {
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1Json };
      trx.data = '0x';
      const tx = Transaction.from(trx);
      const assets = { ...TestData.transaction1Assets };
      assets.tokens = [];
      tx.type = 3;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test function and expect error
      expect(async () => {
        await evmChain.getTransactionAssets(paymentTx);
      }).rejects.toThrowError(TransactionFormatError);
    });
  });

  describe('verifyTransactionFee', () => {
    /**
     * @target EvmChain.verifyTransactionFee should return true when
     * both fee and gas limits were set properly
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when both fee and gas limits were set properly', async () => {
      // mock a config that has almost the same fee as the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when `to` is null
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * @expected
     * - return false
     */
    it('should return false when `to` is null', async () => {
      // mock a config that has almost the same fee as the transaction fee
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;
      tx.to = null;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when transaction is not of type 2
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * @expected
     * - return false
     */
    it('should return false when transaction is not of type 2', async () => {
      // mock a config that has almost the same fee as the transaction fee
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;
      tx.type = 3;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when gas limit is wrong
     * for erc-20 transfer
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when gas limit is wrong for erc-20 transfer', async () => {
      // mock a config that has more fee and wrong required gas
      // comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 56000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 0n;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when gas limit is wrong
     * for native-token transfer
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when gas limit is wrong for native-token transfer', async () => {
      // mock a config that has more fee and wrong required gas
      // comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 23000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 10n;
      tx.data = '0x';

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when maxFeePerGas
     * is too much bigger than expected
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when maxFeePerGas is too much bigger than expected', async () => {
      // mock a config that has too much bigger max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 76000n;
      tx.maxFeePerGas = 28n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 10n;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when maxPriorityFeePerGas
     * is too much bigger than expected
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when maxPriorityFeePerGas is too much bigger than expected', async () => {
      // mock a config that has too much bigger max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 76000n;
      tx.maxFeePerGas = 20n;
      tx.maxPriorityFeePerGas = 10n;
      tx.value = 10n;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when maxPriorityFeePerGas
     * is too much smaller than expected
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when maxPriorityFeePerGas is too much smaller than expected', async () => {
      // mock a config that has too much bigger max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 76000n;
      tx.maxFeePerGas = 20n;
      tx.maxPriorityFeePerGas = 5n;
      tx.value = 10n;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionFee should return false when maxFeePerGas
     * is too much smaller than expected
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when max fee per gas is too much smaller than exptected', async () => {
      // mock a config that has too much smaller max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 76000n;
      tx.maxFeePerGas = 16n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 10n;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = await evmChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('extractTransactionOrder', () => {
    /**
     * @target EvmChain.extractTransactionOrder should extract transaction
     * order successfully for ERC-20 token transfer only
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully for ERC-20 token transfer only', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(TestData.splittedOrders[1]);
    });

    /**
     * @target EvmChain.extractTransactionOrder should extract transaction
     * order successfully when there is native-token transfer only
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully when there is native-token transfer only', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from({
        ...(TestData.erc20transaction as TransactionLike),
      });
      tx.data = '0x';
      tx.value = 100n;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual([
        {
          address: '0xedee4752e5a2f595151c94762fb38e5730357785',
          assets: {
            nativeToken: 100n,
            tokens: [],
          },
        },
      ]);
    });

    /**
     * @target EvmChain.extractTransactionOrder should extract transaction
     * order successfully when there are native and ERC-20 token transfers to same address
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully when there are native and ERC-20 token transfers to same address', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from({
        ...(TestData.erc20transaction as TransactionLike),
      });
      tx.value = 100n;
      tx.to = '0xcfb01d43cb1299024171141d449bb9cd08f4c075';
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual([
        {
          address: '0xcfb01d43cb1299024171141d449bb9cd08f4c075',
          assets: {
            nativeToken: 100n,
            tokens: [
              {
                id: '0xcfb01d43cb1299024171141d449bb9cd08f4c075',
                value: 3305307248n,
              },
            ],
          },
        },
      ]);
    });

    /**
     * @target EvmChain.extractTransactionOrder should extract transaction
     * order successfully when there are native and ERC-20 token transfers to different addresses
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully when there are native and ERC-20 token transfers to different addresses', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from({
        ...(TestData.erc20transaction as TransactionLike),
      });
      tx.value = 100n;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual([
        {
          address: '0xedee4752e5a2f595151c94762fb38e5730357785',
          assets: {
            nativeToken: 100n,
            tokens: [],
          },
        },
        {
          address: '0xcfb01d43cb1299024171141d449bb9cd08f4c075',
          assets: {
            nativeToken: 0n,
            tokens: [
              {
                id: '0xedee4752e5a2f595151c94762fb38e5730357785',
                value: 3305307248n,
              },
            ],
          },
        },
      ]);
    });

    /**
     * @target EvmChain.extractTransactionOrder should throw error when `to` is null
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * @expected
     * - throw error
     */
    it('should throw error when `to` is null', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const trx = { ...(TestData.erc20transaction as TransactionLike) };
      trx.to = null;
      const tx = Transaction.from(trx);
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      expect(async () =>
        evmChain.extractTransactionOrder(paymentTx)
      ).rejects.toThrowError(TransactionFormatError);
    });
  });

  describe('submitTransaction', () => {
    /**
     * @target EvmChain.submitTransaction should submit the transaction
     * when transaction is of type 2, fees are set properly and lock address has enough assets
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - mock getMaxFeePerGas, getMaxPriorityFeePerGas
     * - mock hasLockAddressEnoughAssets
     * - run test
     * - check function is called
     * @expected
     * - it should call the function
     */
    it('should submit the transaction when transaction is of type 2, fees are set properly and lock address has enough assets', async () => {
      // mock getMaxFeePerGas, getMaxPriorityFeePerGas, and hasLockAddressEnoughAssets
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 20n;
      tx.maxPriorityFeePerGas = 7n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );
      const submitTransactionSpy = vi.spyOn(network, 'submitTransaction');
      submitTransactionSpy.mockImplementation(async () => undefined);
      await evmChain.submitTransaction(paymentTx);
      expect(submitTransactionSpy).toHaveBeenCalled();
    });

    /**
     * @target EvmChain.submitTransaction should not submit the transaction
     * when transaction is not of type 2
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - run test
     * - check function is not called
     * @expected
     * - it should not call the function
     */
    it('should submit the transaction when transaction is not of type 2', async () => {
      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.type = 3;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );
      const submitTransactionSpy = vi.spyOn(network, 'submitTransaction');
      submitTransactionSpy.mockImplementation(async () => undefined);
      await evmChain.submitTransaction(paymentTx);
      expect(submitTransactionSpy).not.toHaveBeenCalled();
    });

    /**
     * @target EvmChain.submitTransaction should not submit the transaction
     * when max fee per gas is wrong
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - mock getMaxFeePerGas, getMaxPriorityFeePerGas
     * - mock hasLockAddressEnoughAssets
     * - run test
     * - check function is not called
     * @expected
     * - it should not call the function
     */
    it('should submit the transaction when max fee per gas is wrong', async () => {
      // mock getMaxFeePerGas, getMaxPriorityFeePerGas, and hasLockAddressEnoughAssets
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 21n;
      tx.maxPriorityFeePerGas = 6n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );
      const submitTransactionSpy = vi.spyOn(network, 'submitTransaction');
      submitTransactionSpy.mockImplementation(async () => undefined);
      await evmChain.submitTransaction(paymentTx);
      expect(submitTransactionSpy).not.toHaveBeenCalled();
    });

    /**
     * @target EvmChain.submitTransaction should not submit the transaction
     * when max priority fee per gas is wrong
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - mock getMaxFeePerGas, getMaxPriorityFeePerGas
     * - mock hasLockAddressEnoughAssets
     * - run test
     * - check the function is not called
     * @expected
     * - it should not call the function
     */
    it('should submit the transaction when max fee per gas is wrong', async () => {
      // mock getMaxFeePerGas, getMaxPriorityFeePerGas, and hasLockAddressEnoughAssets
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 20n;
      tx.maxPriorityFeePerGas = 6n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );
      const submitTransactionSpy = vi.spyOn(network, 'submitTransaction');
      submitTransactionSpy.mockImplementation(async () => undefined);
      await evmChain.submitTransaction(paymentTx);
      expect(submitTransactionSpy).not.toHaveBeenCalled();
    });

    /**
     * @target EvmChain.submitTransaction should not submit the transaction
     * when lock address does not have enough asset
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - mock getMaxFeePerGas, getMaxPriorityFeePerGas
     * - mock hasLockAddressEnoughAssets
     * - run test
     * - check the function is not called
     * @expected
     * - it should not call the function
     */
    it('should submit the transaction when lock address does not have enough asset', async () => {
      // mock getMaxFeePerGas, getMaxPriorityFeePerGas, and hasLockAddressEnoughAssets
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, false);

      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1Json);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 20n;
      tx.maxPriorityFeePerGas = 7n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );
      const submitTransactionSpy = vi.spyOn(network, 'submitTransaction');
      submitTransactionSpy.mockImplementation(async () => undefined);
      await evmChain.submitTransaction(paymentTx);
      expect(submitTransactionSpy).not.toHaveBeenCalled();
    });
  });

  describe('verifyTransactionExtraConditions', () => {
    /**
     * @target EvmChain.verifyTransactionExtraConditions should return true
     * for erc-20 transfer when extra conditions are met and eventId is not empty
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true for erc-20 transfer when extra conditions are met and eventId is not empty', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when transaction is not of type 2
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when transaction is not of type 2', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.type = 3;

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return true
     * for erc-20 transfer when extra conditions are met and eventId is empty
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when extra conditions are met and eventId is empty', async () => {
      // mock PaymentTransaction
      const eventId = '';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.data = tx.data.substring(0, tx.data.length - 32);
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return true
     * for native-token transfer when extra conditions are met and eventId is not empty
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true for native-token transfer when extra conditions are met and eventId is not empty', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.data = '0x' + eventId;
      tx.to = TestData.lockAddress;
      tx.value = 10n;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return true
     * for native-token transfer when extra conditions are met and eventId is empty
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when extra conditions are met and eventId is empty', async () => {
      // mock PaymentTransaction
      const eventId = '';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.data = tx.data.substring(0, tx.data.length - 32);
      tx.data = '0x' + eventId;
      tx.to = TestData.lockAddress;
      tx.value = 10n;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when `to` is null
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when `to` is null', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const trx = { ...(TestData.erc20transaction as TransactionLike) };
      trx.to = null;
      const tx = Transaction.from(trx);
      tx.maxFeePerBlobGas = 0;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when `data` is null
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when `data` is null', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const trx = { ...(TestData.erc20transaction as TransactionLike) };
      trx.data = null;
      const tx = Transaction.from(trx);
      tx.maxFeePerBlobGas = 0;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when eventId is not at the end of `data`
     * @dependencies
     * @scenario
     * - mock invalid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when eventId is not at the end of `data`', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const trx = { ...(TestData.erc20transaction as TransactionLike) };
      trx.data =
        trx.data?.substring(0, trx.data.length - eventId.length) +
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbc';
      const tx = Transaction.from(trx);
      tx.maxFeePerBlobGas = 0;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when both an erc-20 and the native-token are being transfered
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when both an erc-20 and the native-token are being transfered', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.value = 10000n;
      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when there are extra bytes in the data
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when there are extra bytes in the data', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.data =
        tx.data.substring(0, 138) + 'eeeeeeeeee' + tx.data.substring(138);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when it's an erc-20 token transfer but `data` does not match with `transfer`
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it("should return false when it's an erc-20 token transfer but `data` does not match with `transfer`", async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.data = '0x343' + tx.data.substring(5);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when it's an erc-20 token transfer but `to` can not be parsed to an address
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it("should return false when it's an erc-20 token transfer but `to` can not be parsed to an address", async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.data = tx.data.substring(0, 30) + 'e43ba' + tx.data.substring(35);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('isTxValid', () => {
    /**
     * @target EvmChain.isTxValid should return true when
     * nonce is not used
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock getAddressNextAvailableNonce
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when nonce is not used', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce);

      // run test
      const result = await evmChain.isTxValid(paymentTx, SigningStatus.Signed);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.isTxValid should return false when nonce is already used
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock getAddressNextAvailableNonce
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when nonce is already used', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = TransactionType.payment;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce + 1);

      // run test
      const result = await evmChain.isTxValid(paymentTx, SigningStatus.Signed);

      // check returned value
      expect(result).toEqual(false);
    });
  });
});
