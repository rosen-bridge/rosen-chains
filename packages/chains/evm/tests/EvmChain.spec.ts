import TestEvmNetwork from './network/TestEvmNetwork';
import * as TestData from './testData';

import {
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
    return new TestChain(network, testUtils.configs, feeRatioDivisor, signFn);
  };
  const evmChain = generateChainObject(network);

  describe('generateTransaction', () => {
    /**
     * @target EvmChain.generateTransaction should generate payment
     * transaction successfully for ERC-20 token transfer
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets, getMaxFeePerGas
     * - mock getGasRequiredERC20Transfer, getAddressNextNonce
     * - mock getMaxPriorityFeePerGas
     * - call the function
     * - check returned value
     * @expected
     * - PaymentTransaction txType, eventId and network should be as
     *   expected
     * - extracted order of generated transaction should be the same as input
     *   order
     * - eventId should be properly encoded at the end of the transaction data
     * - no extra data should be found in the transaction data
     * - transaction must be of type 2 and has no blobs
     */
    it('should generate payment transaction successfully for ERC-20 token transfer', async () => {
      const order = TestData.erc20PaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);
      testUtils.mockGetMaxFeePerGas(network, BigInt(10));
      testUtils.mockGetGasRequiredERC20Transfer(network, BigInt(10));
      testUtils.mockGetAddressNextAvailableNonce(network, 24);
      testUtils.mockGetMaxPriorityFeePerGas(network, BigInt(10));

      // call the function
      const evmTx = await evmChain.generateTransaction(
        eventId,
        txType,
        order,
        [],
        []
      );

      // check returned value
      expect(evmTx.txType).toEqual(txType);
      expect(evmTx.eventId).toEqual(eventId);
      expect(evmTx.network).toEqual(evmChain.CHAIN_NAME);

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = evmChain.extractTransactionOrder(evmTx);
      expect(extractedOrder).toEqual(order);

      // check eventId encoded at the end of the data
      expect(
        Serializer.deserialize(evmTx.txBytes).data.substring(138, 138 + 32)
      ).toEqual(eventId);

      // check there is no more data
      expect(Serializer.deserialize(evmTx.txBytes).data.length).toEqual(
        138 + 32
      );

      // check transaction type
      expect(Serializer.deserialize(evmTx.txBytes).type).toEqual(2);

      // check blobs zero
      expect(Serializer.deserialize(evmTx.txBytes).maxFeePerBlobGas).toEqual(
        null
      );
    });

    /**
     * @target EvmChain.generateTransaction should generate payment
     * transaction successfully for the native-token transfer
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
    it('should generate payment transaction successfully for the native-token transfer', async () => {
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

      // call the function
      const evmTx = await evmChain.generateTransaction(
        eventId,
        txType,
        order,
        [],
        []
      );

      // check returned value
      expect(evmTx.txType).toEqual(txType);
      expect(evmTx.eventId).toEqual(eventId);
      expect(evmTx.network).toEqual(evmChain.CHAIN_NAME);

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = evmChain.extractTransactionOrder(evmTx);
      expect(extractedOrder).toEqual(order);

      // check eventId encoded at the end of the data
      expect(
        Serializer.deserialize(evmTx.txBytes).data.substring(2, 34)
      ).toEqual(eventId);

      // check there is no more data
      expect(Serializer.deserialize(evmTx.txBytes).data.length).toEqual(34);
    });

    /**
     * @target EvmChain.generateTransaction should throw error
     * when lock address does not have enough assets
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets
     * - call the function and expect error
     * @expected
     * - generateTransaction should throw NotEnoughAssetsError
     */
    it('should throw error when lock address does not have enough assets', async () => {
      const order = TestData.nativePaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets
      testUtils.mockHasLockAddressEnoughAssets(evmChain, false);

      // call the function and expect error
      await expect(async () => {
        await evmChain.generateTransaction(eventId, txType, order, [], []);
      }).rejects.toThrow(NotEnoughAssetsError);
    });

    /**
     * @target EvmChain.generateTransaction should throw error
     * when there is no slot for generating new transactions
     * @dependencies
     * @scenario
     * - fill the unsigned and signed transactions lists with mock data
     * - call the function and expect error
     * @expected
     * - generateTransaction should throw MaxParallelTxError
     */
    it('should throw error when there is no slot for generating new transactions', async () => {
      const order = TestData.nativePaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const unsigned = [...Array(5).keys()].map(
        (elem: number) =>
          new PaymentTransaction('', '', '', Buffer.from(''), txType)
      );
      const signed = [...Array(5).keys()].map((_) => '');

      // call the function and expect error
      await expect(async () => {
        await evmChain.generateTransaction(
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
        evmChain.CHAIN_NAME,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // check returned value
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
        evmChain.CHAIN_NAME,
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
      // mock a config that has more fee comparing to mocked transaction fee
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // run test
      const result = evmChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(TestData.erc20PaymentOrder);
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
    it('should return false when both an erc-20 and the native-token are being transfered', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.data =
        tx.data.substring(0, 138) + 'eeeeeeeeee' + tx.data.substring(138);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN_NAME,
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
     * when it's an erc-20 token transfer but calldata does not match with `transfer`
     * @dependencies
     * @scenario
     * - mock valid PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it("should return false when it's an erc-20 token transfer but calldata does not match with `transfer", async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);
      tx.maxFeePerBlobGas = 0;
      tx.data = '0x343' + tx.data.substring(5);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
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
        evmChain.CHAIN_NAME,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // call the function
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
        evmChain.CHAIN_NAME,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce + 1);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, true);

      // call the function
      const result = await evmChain.isTxValid(paymentTx, SigningStatus.Signed);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EvmChain.isTxValid should return false when lock address no longer has enough assets
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when lock address no longer has enough assets', async () => {
      // mock PaymentTransaction
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;
      const tx = Transaction.from(TestData.erc20transaction as TransactionLike);

      const paymentTx = new PaymentTransaction(
        evmChain.CHAIN_NAME,
        tx.unsignedHash,
        eventId,
        Serializer.serialize(tx),
        txType
      );

      // mock getAddressNextAvailableNonce and hasLockAddressEnoughAssets
      testUtils.mockGetAddressNextAvailableNonce(network, tx.nonce);
      testUtils.mockHasLockAddressEnoughAssets(evmChain, false);

      // call the function
      const result = await evmChain.isTxValid(paymentTx, SigningStatus.Signed);

      // check returned value
      expect(result).toEqual(false);
    });
  });
});
