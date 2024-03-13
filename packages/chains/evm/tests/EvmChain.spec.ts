import TestEvmNetwork from './network/TestEvmNetwork';
import * as TestData from './testData';

import {
  MaxParallelTxError,
  NotEnoughAssetsError,
  PaymentTransaction,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import * as testUtils from './TestUtils';
import TestChain from './TestChain';
import Serializer from '../lib/Serializer';
import { MockGenerator } from './TestUtils';

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
     */
    it('should generate payment transaction successfully', async () => {
      const order = TestData.erc20PaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      MockGenerator.mockHasLockAddressEnoughAssets(evmChain, true);
      MockGenerator.mockGetMaxFeePerGas(network, BigInt(10));
      MockGenerator.mockGetGasRequiredERC20Transfer(network, BigInt(10));
      MockGenerator.mockGetAddressNextNonce(network, 24);
      MockGenerator.mockGetMaxPriorityFeePerGas(network, BigInt(10));

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
      expect(evmTx.network).toEqual(evmChain.CHAIN);

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
    it('should generate payment transaction successfully', async () => {
      const order = TestData.nativePaymentOrder;
      const eventId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      const txType = 'payment' as TransactionType;

      // mock hasLockAddressEnoughAssets, getMaxFeePerGas,
      // getGasRequiredERC20Transfer, getAddressNextNonce, getMaxPriorityFeePerGas
      MockGenerator.mockHasLockAddressEnoughAssets(evmChain, true);
      MockGenerator.mockGetMaxFeePerGas(network, BigInt(10));
      MockGenerator.mockGetGasRequiredNativeTransfer(network, BigInt(10));
      MockGenerator.mockGetAddressNextNonce(network, 24);
      MockGenerator.mockGetMaxPriorityFeePerGas(network, BigInt(10));

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
      expect(evmTx.network).toEqual(evmChain.CHAIN);

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
      MockGenerator.mockHasLockAddressEnoughAssets(evmChain, false);

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
    it('should throw error when lock address does not have enough assets', async () => {
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
});
