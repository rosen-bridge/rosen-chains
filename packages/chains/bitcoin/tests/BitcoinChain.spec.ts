import { vi } from 'vitest';
import { TransactionType } from '@rosen-chains/abstract-chain';
import { BitcoinChain, BitcoinConfigs, BitcoinTransaction } from '../lib';
import TestBitcoinNetwork from './network/TestBitcoinNetwork';
import * as testData from './testData';
import * as testUtils from './testUtils';
import JsonBigInt from '@rosen-bridge/json-bigint';
import { Fee } from '@rosen-bridge/minimum-fee';
import { RosenData } from '@rosen-bridge/rosen-extractor';

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
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction assets (both input and output assets)
     */
    it('should get transaction assets successfully', async () => {
      // mock PaymentTransaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // run test
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
     * - run test
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

      // run test
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

      // run test & check thrown exception
      const bitcoinChain = generateChainObject(network);
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
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when all extra conditions are met', () => {
      // mock a payment transaction
      const paymentTx = BitcoinTransaction.fromJson(
        testData.transaction2PaymentTransaction
      );

      // run test
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
     * - run test
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

      // run test
      const result = bitcoinChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('verifyEvent', () => {
    const feeConfig: Fee = {
      bridgeFee: 0n,
      networkFee: 0n,
      feeRatio: 0n,
      rsnRatio: 0n,
    };

    /**
     * @target BitcoinChain.verifyEvent should return true when event is valid
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return event block height
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return true
     * - `getBlockTransactionIds` and `getBlockInfo` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it('should return true when event is valid', async () => {
      //  mock an event
      const event = testData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock getBlockInfo to return event block height
      const getBlockInfoSpy = vi.spyOn(network, 'getBlockInfo');
      getBlockInfoSpy.mockResolvedValueOnce({
        height: event.sourceChainHeight,
      } as any);

      // mock network extractor to return event data
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(true);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
      expect(getBlockInfoSpy).toHaveBeenCalledWith(event.sourceBlockId);
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when event transaction
     * is not in event block
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds'
     * - run test
     * - check returned value
     * - check if function got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` should have been called with event blockId
     */
    it('should return false when event transaction is not in event block', async () => {
      // mock an event
      const event = testData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds'
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        testUtils.generateRandomId(),
      ]);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);

      // check if function got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when a field of event
     * is wrong
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return event block height
     * - mock network extractor to return event data (expect for a key which
     *   should be wrong)
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` and `getBlockInfo` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it.each([
      'fromChain',
      'toChain',
      'networkFee',
      'bridgeFee',
      'amount',
      'sourceChainTokenId',
      'targetChainTokenId',
      'toAddress',
      'fromAddress',
    ])('should return false when event %p is wrong', async (key: string) => {
      // mock an event
      const event = testData.validEvent;

      //  mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock getBlockInfo to return event block height
      const getBlockInfoSpy = vi.spyOn(network, 'getBlockInfo');
      getBlockInfoSpy.mockResolvedValueOnce({
        height: event.sourceChainHeight,
      } as any);

      // mock network extractor to return event data (expect for a key which
      //   should be wrong)
      const invalidData = event as unknown as RosenData;
      invalidData[key as keyof RosenData] = `fake_${key}`;
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(invalidData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
      expect(getBlockInfoSpy).toHaveBeenCalledWith(event.sourceBlockId);
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when event
     * sourceChainHeight is wrong
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return -1 as event block height
     * - mock network extractor to return event data (expect for a key which
     *   should be wrong)
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` and `getBlockInfo` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it('should return false when event sourceChainHeight is wrong', async () => {
      //  mock an event
      const event = testData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock getBlockInfo to return -1 as event block height
      const getBlockInfoSpy = vi.spyOn(network, 'getBlockInfo');
      getBlockInfoSpy.mockResolvedValueOnce({
        height: -1,
      } as any);

      // mock network extractor to return event data
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
      expect(getBlockInfoSpy).toHaveBeenCalledWith(event.sourceBlockId);
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when event amount
     * is less than sum of event fees
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it('should return false when event amount is less than sum of event fees', async () => {
      // mock an event
      const event = testData.invalidEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when event amount
     * is less than sum of event fees while bridgeFee is less than minimum-fee
     * @dependencies
     * @scenario
     * - mock feeConfig
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it('should return false when event amount is less than sum of event fees while bridgeFee is less than minimum-fee', async () => {
      // mock feeConfig
      const fee: Fee = {
        bridgeFee: 1200000n,
        networkFee: 0n,
        rsnRatio: 0n,
        feeRatio: 0n,
      };

      // mock an event
      const event = testData.validEventWithHighFee;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, fee);

      // check returned value
      expect(result).toEqual(false);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
    });

    /**
     * @target BitcoinChain.verifyEvent should return false when event amount
     * is less than sum of event fees while bridgeFee is less than expected value
     * @dependencies
     * @scenario
     * - mock feeConfig
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * - check if functions got called
     * @expected
     * - it should return false
     * - `getBlockTransactionIds` should have been called with event blockId
     * - `getTransaction` should have been called with event lock txId
     */
    it('should return false when event amount is less than sum of event fees while bridgeFee is less than expected value', async () => {
      // mock feeConfig
      const fee: Fee = {
        bridgeFee: 0n,
        networkFee: 0n,
        rsnRatio: 0n,
        feeRatio: 1200n,
      };

      // mock an event
      const event = testData.validEventWithHighFee;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestBitcoinNetwork();
      const getBlockTransactionIdsSpy = vi.spyOn(
        network,
        'getBlockTransactionIds'
      );
      getBlockTransactionIdsSpy.mockResolvedValueOnce([
        testUtils.generateRandomId(),
        event.sourceTxId,
        testUtils.generateRandomId(),
      ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = testData.bitcoinTx1;
      const getTransactionSpy = vi.spyOn(network, 'getTransaction');
      getTransactionSpy.mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = vi.spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const bitcoinChain = generateChainObject(network);
      const result = await bitcoinChain.verifyEvent(event, fee);

      // check returned value
      expect(result).toEqual(false);

      // check if functions got called
      expect(getBlockTransactionIdsSpy).toHaveBeenCalledWith(
        event.sourceBlockId
      );
      expect(getTransactionSpy).toHaveBeenCalledWith(
        event.sourceTxId,
        event.sourceBlockId
      );
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
     * - run test
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
     * - run test
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
     * - run test
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

      // run test
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
     * - run test & check thrown exception
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

      // run test
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
     * - run test
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

      // run test
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
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box info successfully', async () => {
      // mock a BitcoinUtxo with assets
      const rawBox = testData.lockUtxo;

      // run test
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
