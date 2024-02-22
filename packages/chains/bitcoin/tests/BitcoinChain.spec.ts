import { vi } from 'vitest';
import { TransactionType } from '@rosen-chains/abstract-chain';
import { BitcoinChain, BitcoinConfigs, BitcoinTransaction } from '../lib';
import TestBitcoinNetwork from './network/TestBitcoinNetwork';
import * as testData from './testData';
import JsonBigInt from '@rosen-bridge/json-bigint';

describe('BitcoinChain', () => {
  const observationTxConfirmation = 5;
  const paymentTxConfirmation = 9;
  const coldTxConfirmation = 10;
  const manualTxConfirmation = 11;
  const rwtId =
    '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
  const feeRationDivisor = 1n;
  const configs: BitcoinConfigs = {
    fee: 1000000n,
    minBoxValue: 0n,
    addresses: {
      lock: testData.lockAddress,
      cold: 'cold',
      permit: 'permit',
      fraud: 'fraud',
    },
    rwtId: rwtId,
    confirmations: {
      observation: observationTxConfirmation,
      payment: paymentTxConfirmation,
      cold: coldTxConfirmation,
      manual: manualTxConfirmation,
    },
    aggregatedPublicKey: testData.lockAddressPublicKey,
  };
  const mockedSignFn = () => Promise.resolve('');
  const generateChainObject = (
    network: TestBitcoinNetwork,
    signFn: (txHash: Uint8Array) => Promise<string> = mockedSignFn
  ) => {
    return new BitcoinChain(network, configs, feeRationDivisor, signFn);
  };

  describe('getTransactionAssets', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.getTransactionAssets should get transaction assets
     * successfully
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction assets (both input and output assets)
     */
    it('should get transaction assets successfully', async () => {
      // mock PaymentTransaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // call the function
      const bitcoinChain = generateChainObject(network);

      // check returned value
      const result = await bitcoinChain.getTransactionAssets(paymentTx);
      expect(result).toEqual(testData.transaction2Assets);
    });
  });

  describe('extractTransactionOrder', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.extractTransactionOrder should extract transaction
     * order successfully
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should extract transaction order successfully', () => {
      // mock PaymentTransaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );
      const expectedOrder = testData.transaction2Order;

      // call the function
      const bitcoinChain = generateChainObject(network);
      const result = bitcoinChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(expectedOrder);
    });

    /**
     * @target BitcoinChain.extractTransactionOrder should throw error
     * when tx has OP_RETURN utxo
     * @dependencies
     * @scenario
     * - mock PaymentTransaction with OP_RETURN output
     * - run test & check thrown exception
     * @expected
     * - it should throw Error
     */
    it('should throw error when tx has OP_RETURN utxo', () => {
      // mock PaymentTransaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction1PaymentTransaction
      );

      // call the function
      const bitcoinChain = generateChainObject(network);

      // run test & check thrown exception
      expect(() => {
        bitcoinChain.extractTransactionOrder(paymentTx);
      }).toThrow(Error);
    });
  });

  describe('verifyExtraCondition', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target: BitcoinChain.verifyTransactionExtraConditions should return true when all
     * extra conditions are met
     * @dependencies
     * @scenario
     * - mock a payment transaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when all extra conditions are met', () => {
      // mock a payment transaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // call the function
      const bitcoinChain = generateChainObject(network);
      const result = bitcoinChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target: BitcoinChain.verifyTransactionExtraConditions should return false
     * when change box address is wrong
     * @dependencies
     * @scenario
     * - mock a payment transaction
     * - create a new BitcoinChain object with custom lock address
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when change box address is wrong', () => {
      // mock a payment transaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction0PaymentTransaction
      );

      // create a new BitcoinChain object with custom lock address
      const newConfigs = structuredClone(configs);
      newConfigs.addresses.lock = 'bc1qs2qr0j7ta5pvdkv53egm38zymgarhq0ugr7x8j';
      const bitcoinChain = new BitcoinChain(
        network,
        newConfigs,
        feeRationDivisor,
        mockedSignFn
      );

      // call the function
      const result = bitcoinChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('isTxValid', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.isTxValid should return true when
     * all tx inputs are valid and ttl is less than current slot
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction
     * - call the function
     * - check returned value
     * - check if function got called
     * @expected
     * - it should return true
     */
    it('should return true when all tx inputs are valid and ttl is less than current slot', async () => {
      const payment1 = BitcoinTransaction.fromJson(
        testData.transaction0PaymentTransaction
      );

      const isBoxUnspentAndValidSpy = vi.spyOn(network, 'isBoxUnspentAndValid');
      isBoxUnspentAndValidSpy.mockResolvedValue(true);

      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.isTxValid(payment1);

      expect(result).toEqual(true);
      expect(isBoxUnspentAndValidSpy).toHaveBeenCalledWith(
        testData.transaction0Input0BoxId
      );
    });

    /**
     * @target BitcoinChain.isTxValid should return false when at least one input
     * is invalid
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction except for the first one
     * - call the function
     * - check returned value
     * - check if function got called
     * @expected
     * - it should return false
     */
    it('should return false when at least one input is invalid', async () => {
      const payment1 = BitcoinTransaction.fromJson(
        testData.transaction0PaymentTransaction
      );

      const isBoxUnspentAndValidSpy = vi.spyOn(network, 'isBoxUnspentAndValid');
      isBoxUnspentAndValidSpy
        .mockResolvedValue(true)
        .mockResolvedValueOnce(false);

      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.isTxValid(payment1);

      expect(result).toEqual(false);
      expect(isBoxUnspentAndValidSpy).toHaveBeenCalledWith(
        testData.transaction0Input0BoxId
      );
    });
  });

  describe('signTransaction', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.signTransaction should return PaymentTransaction of the
     * signed transaction
     * @dependencies
     * @scenario
     * - mock a sign function to return signature for expected messages
     * - mock PaymentTransaction of unsigned transaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return PaymentTransaction of signed transaction (all fields
     *   are same as input object, except txBytes which is signed transaction)
     */
    it('should return PaymentTransaction of the signed transaction', async () => {
      // mock a sign function to return signature
      const signFunction = async (hash: Uint8Array): Promise<string> => {
        const hashHex = Buffer.from(hash).toString('hex');
        if (hashHex === testData.transaction2HashMessage0)
          return testData.transaction2Signature0;
        else if (hashHex === testData.transaction2HashMessage1)
          return testData.transaction2Signature1;
        else
          throw Error(
            `TestError: sign function is called with wrong message [${hashHex}]`
          );
      };

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // call the function
      const bitcoinChain = generateChainObject(network, signFunction);
      const result = await bitcoinChain.signTransaction(paymentTx, 0);

      // check returned value
      expect(result.txId).toEqual(paymentTx.txId);
      expect(result.eventId).toEqual(paymentTx.eventId);
      expect(Buffer.from(result.txBytes).toString('hex')).toEqual(
        testData.transaction2SignedTxBytesHex
      );
      expect(result.txType).toEqual(paymentTx.txType);
      expect(result.network).toEqual(paymentTx.network);
    });

    /**
     * @target BitcoinChain.signTransaction should throw error when at least signing of one message is failed
     * @dependencies
     * @scenario
     * - mock a sign function to throw error for 2nd message
     * - mock PaymentTransaction of unsigned transaction
     * - call the function & check thrown exception
     * @expected
     * - it should throw the exact error thrown by sign function
     */
    it('should throw error when at least signing of one message is failed', async () => {
      // mock a sign function to throw error
      const signFunction = async (hash: Uint8Array): Promise<string> => {
        if (
          Buffer.from(hash).toString('hex') ===
          testData.transaction2HashMessage0
        )
          return testData.transaction2Signature0;
        else throw Error(`TestError: sign failed`);
      };

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // call the function
      const bitcoinChain = generateChainObject(network, signFunction);

      await expect(async () => {
        await bitcoinChain.signTransaction(paymentTx, 0);
      }).rejects.toThrow('TestError: sign failed');
    });
  });

  describe('rawTxToPaymentTransaction', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.rawTxToPaymentTransaction should construct transaction successfully
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock getUtxo
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction order
     */
    it('should construct transaction successfully', async () => {
      // mock PaymentTransaction
      const expectedTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );
      expectedTx.eventId = '';
      expectedTx.txType = TransactionType.manual;

      // mock getUtxo
      const getUtxoSpy = vi.spyOn(network, 'getUtxo');
      expectedTx.inputUtxos.forEach((utxo) =>
        getUtxoSpy.mockResolvedValueOnce(JsonBigInt.parse(utxo))
      );

      // call the function
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.rawTxToPaymentTransaction(
        Buffer.from(expectedTx.txBytes).toString('hex')
      );

      // check returned value
      expect(result.toJson()).toEqual(expectedTx.toJson());
    });
  });

  describe('getBoxInfo', () => {
    const network = new TestBitcoinNetwork();

    /**
     * @target BitcoinChain.getBoxInfo should get box id and assets correctly
     * @dependencies
     * @scenario
     * - mock a BitcoinUtxo with assets
     * - call the function
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box info successfully', async () => {
      // mock a BitcoinUtxo with assets
      const rawBox = testData.lockUtxo;

      // call the function
      const bitcoinChain = generateChainObject(network);

      // check returned value
      const result = await bitcoinChain.getBoxInfo(rawBox);
      expect(result.id).toEqual(rawBox.txId + '.' + rawBox.index);
      expect(result.assets.nativeToken.toString()).toEqual(
        rawBox.value.toString()
      );
    });
  });
});
