import { expect } from 'vitest';
import TestEvmNetwork from './network/TestEvmNetwork';
import * as TestData from './testData';

import {
  AssetNotSupportedError,
  MaxParallelTxError,
  NotEnoughAssetsError,
  PaymentTransaction,
  SigningStatus,
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
     */
    it('should generate payment transactions successfully for multiple orders', async () => {
      const orders = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetMaxFeePerGas(network, BigInt(10));
      testUtils.mockGetGasRequiredNativeTransfer(network, BigInt(5));
      testUtils.mockGetGasRequiredERC20Transfer(network, BigInt(10));
      testUtils.mockGetAddressNextAvailableNonce(network, 24);
      testUtils.mockGetMaxPriorityFeePerGas(network, BigInt(10));

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
        const txData = Serializer.deserialize(evmTx.txBytes).data;
        expect(txData.substring(txData.length - 32)).toEqual(eventId);

        // check there is no more data
        if (order[0].assets.nativeToken != 0n)
          expect(Serializer.deserialize(evmTx.txBytes).data.length).toEqual(34);
        else
          expect(Serializer.deserialize(evmTx.txBytes).data.length).toEqual(
            170
          );

        // check transaction type
        expect(Serializer.deserialize(evmTx.txBytes).type).toEqual(2);

        // check blobs zero
        expect(Serializer.deserialize(evmTx.txBytes).maxFeePerBlobGas).toEqual(
          null
        );
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
     */
    it('should generate payment transaction successfully successfully for single order', async () => {
      const order = TestData.nativePaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetMaxFeePerGas(network, BigInt(10));
      testUtils.mockGetGasRequiredNativeTransfer(network, BigInt(10));
      testUtils.mockGetAddressNextAvailableNonce(network, 24);
      testUtils.mockGetMaxPriorityFeePerGas(network, BigInt(10));

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

      // check eventId encoded at the end of the data
      expect(
        Serializer.deserialize(evmTx[0].txBytes).data.substring(2, 34)
      ).toEqual(eventId);

      // check there is no more data
      expect(Serializer.deserialize(evmTx[0].txBytes).data.length).toEqual(34);
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
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;

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
     * when there is no slot for generating new transactions
     * @dependencies
     * @scenario
     * - fill the unsigned and signed transactions lists with mock data
     * - call the function
     * @expected
     * - throw MaxParallelTxError
     */
    it('should throw error when there is no slot for generating new transactions', async () => {
      const order = TestData.multipleOrders;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const unsigned = [...Array(5).keys()].map(
        (elem: number) =>
          new PaymentTransaction('', '', '', Buffer.from(''), txType)
      );
      const signed = [...Array(5).keys()].map((_) => '');

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
  });

  describe('getTransactionAssets', () => {
    /**
     * @target EvmChain.getTransactionAssets should get transaction assets
     * successfully when there is ERC-20 token transfer.
     * Inputs and outputs must be equal and network fee should be considered.
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
      const txType = 'payment' as TransactionType;
      // mock PaymentTransaction
      const tx = Transaction.from(TestData.transaction1JsonString);
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
     * Inputs and outputs must be equal and network fee should be considered.
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
      const txType = 'payment' as TransactionType;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1JsonString };
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
      const txType = 'payment' as TransactionType;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1JsonString };
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
      }).rejects.toThrowError(
        'Transaction [0xb75ebe297f5614e5217a366b2f2668827793147beca469b7555126fc97a1af21] does not have `to`'
      );
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
      const txType = 'payment' as TransactionType;
      // mock PaymentTransaction
      const trx = { ...TestData.transaction1JsonString };
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
      }).rejects.toThrowError(
        'Transaction [0x4080be6a6dea8e286c0d21bd0ea865a45805d48902cac0a683a810a55da65946] is not of type 2'
      );
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
      const tx = Transaction.from(TestData.transaction1JsonString);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
      const tx = Transaction.from(TestData.transaction1JsonString);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;
      tx.to = null;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
      const tx = Transaction.from(TestData.transaction1JsonString);
      tx.gasLimit = 55000n + 21000n;
      tx.maxFeePerGas = 22n;
      tx.maxPriorityFeePerGas = 8n;
      tx.value = 2n;
      tx.type = 3;

      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.transaction1JsonString);
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
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.transaction1JsonString);
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
     * @target EvmChain.verifyTransactionFee should return false when max gas per fee
     * is too much bigger than network max fee
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when max gas per fee is too much bigger than network max fee', async () => {
      // mock a config that has too much bigger max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.transaction1JsonString);
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
     * @target EvmChain.verifyTransactionFee should return false when max fee per gas
     * is too much smaller than network max fee
     * @dependencies
     * @scenario
     * - mock mockGetGasRequiredERC20Transfer, mockGetGasRequiredNativeTransfer
     * - mock mockGetMaxFeePerGas, mockGetMaxPriorityFeePerGas
     * - mock PaymentTransaction
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when max fee per gas is too much smaller than network max fee', async () => {
      // mock a config that has too much smaller max fee comparing to the mocked transaction
      testUtils.mockGetGasRequiredERC20Transfer(network, 55000n);
      testUtils.mockGetGasRequiredNativeTransfer(network, 21000n);
      testUtils.mockGetMaxFeePerGas(network, 20n);
      testUtils.mockGetMaxPriorityFeePerGas(network, 7n);

      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.transaction1JsonString);
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
     * order successfully
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully', () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
      ).rejects.toThrowError(
        "Transaction [0xa8e73a81f4578701d095bba00c361af31dea092e009faef02fac6c8c45758a93] does not have 'to'"
      );
    });
  });

  describe('verifyTransactionExtraConditions', () => {
    /**
     * @target EvmChain.verifyTransactionExtraConditions should return true
     * when extra conditions are met
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when extra conditions are met', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
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
      expect(result).toEqual(true);
    });

    /**
     * @target EvmChain.verifyTransactionExtraConditions should return false
     * when 'to' is null
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return true when `to` is null', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
     * when `data` is less than 34 bytes
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return true when `data` is less than 34 bytes', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const trx = { ...(TestData.erc20transaction as TransactionLike) };
      trx.data = '0x123456789a';
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
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return true when `data` is null', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
      const txType = 'payment' as TransactionType;
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
  });

  describe('isTxValid', () => {
    /**
     * @target EvmChain.isTxValid should return true when
     * nonce is not used and lock address still has enough assets
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock getAddressNextAvailableNonce, hasLockAddressEnoughAssets
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when nonce is not used and lock address still has enough assets', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

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
     * - mock getAddressNextAvailableNonce, hasLockAddressEnoughAssets
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when nonce is already used', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce + 1);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // run test
      const result = await evmChain.isTxValid(paymentTx, SigningStatus.Signed);

      // check returned value
      expect(result).toEqual(false);
    });
  });
});
