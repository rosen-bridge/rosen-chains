import * as boxTestData from './boxTestData';
import * as transactionTestData from './transactionTestData';
import * as ergoTestUtils from './ergoTestUtils';
import { ErgoChain } from '../lib';
import {
  BoxInfo,
  ChainUtils,
  ConfirmationStatus,
  PaymentTransaction,
  ValueError,
} from '@rosen-chains/abstract-chain';
import TestErgoNetwork from './network/TestErgoNetwork';
import { ErgoConfigs } from '../lib/types';
import { when } from 'jest-when';
import * as wasm from 'ergo-lib-wasm-nodejs';
import ErgoTransaction from '../lib/ErgoTransaction';

const spyOn = jest.spyOn;

describe('ErgoChain', () => {
  const paymentTxConfirmation = 9;
  const coldTxConfirmation = 10;
  const generateChainObject = (network: TestErgoNetwork) => {
    const config: ErgoConfigs = {
      fee: 100n,
      observationTxConfirmation: 5,
      paymentTxConfirmation: paymentTxConfirmation,
      coldTxConfirmation: coldTxConfirmation,
      lockAddress: 'lock_addr',
      coldStorageAddress: 'cold_addr',
      rwtId: 'rwt',
      minBoxValue: 1000000n,
      eventTxConfirmation: 18,
    };
    return new ErgoChain(network, config);
  };

  describe('isTxValid', () => {
    /**
     * @target ErgoChain.isTxValid should return true when all inputs are valid
     * @dependencies
     * @scenario
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when all inputs are valid', async () => {
      // mock a network object to return as valid for all inputs of a mocked transaction
      const network = new TestErgoNetwork();
      const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
      transactionTestData.transaction0InputIds.forEach((inputId) =>
        when(isBoxUnspentAndValidSpy)
          .calledWith(inputId)
          .mockResolvedValueOnce(true)
      );

      // mock PaymentTransaction
      const paymentTx = new ErgoTransaction(
        'txId',
        'eventId',
        ergoTestUtils
          .toTransaction(transactionTestData.transaction0)
          .sigma_serialize_bytes(),
        [],
        [],
        'txType'
      );

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.isTxValid(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target ErgoChain.isTxValid should return false when at least one input
     * is invalid
     * @dependencies
     * @scenario
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction except for the first one
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when at least one input is invalid', async () => {
      // mock a network object to return as valid for all inputs of a mocked transaction except for the first one
      const network = new TestErgoNetwork();
      const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
      let isFirstBox = true;
      transactionTestData.transaction0InputIds.forEach((inputId) => {
        when(isBoxUnspentAndValidSpy)
          .calledWith(inputId)
          .mockResolvedValueOnce(!isFirstBox);
        isFirstBox = false;
      });

      // mock PaymentTransaction
      const paymentTx = new ErgoTransaction(
        'txId',
        'eventId',
        ergoTestUtils
          .toTransaction(transactionTestData.transaction0)
          .sigma_serialize_bytes(),
        [],
        [],
        'txType'
      );

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.isTxValid(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('signTransaction', () => {
    const ergoChain = generateChainObject(new TestErgoNetwork());

    /**
     * @target ErgoChain.signTransaction should return PaymentTransaction of the
     * signed transaction
     * @dependencies
     * @scenario
     * - mock a sign function to return signed transaction
     * - mock PaymentTransaction of unsigned transaction
     * - run test
     * - check returned value
     * @expected
     * - it should return PaymentTransaction of signed transaction (all fields
     *   are same as input object, except txBytes which is signed transaction)
     */
    it('should return PaymentTransaction of the signed transaction', async () => {
      // mock a sign function to return signed transaction
      const signFunction = async (
        tx: wasm.ReducedTransaction,
        requiredSign: number,
        boxes: Array<wasm.ErgoBox>,
        dataBoxes?: Array<wasm.ErgoBox>
      ): Promise<wasm.Transaction> =>
        ergoTestUtils.deserializeTransaction(
          transactionTestData.transaction2SignedSerialized
        );

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = new ErgoTransaction(
        'txId',
        'eventId',
        wasm.ReducedTransaction.sigma_parse_bytes(
          Buffer.from(transactionTestData.transaction2UnsignedSerialized, 'hex')
        ).sigma_serialize_bytes(),
        [],
        [],
        'txType'
      );

      // run test
      const result = (await ergoChain.signTransaction(
        paymentTx,
        0,
        signFunction
      )) as ErgoTransaction;

      // check returned value
      expect(result.txId).toEqual(paymentTx.txId);
      expect(result.eventId).toEqual(paymentTx.eventId);
      expect(result.txBytes).toEqual(
        ergoTestUtils
          .deserializeTransaction(
            transactionTestData.transaction2SignedSerialized
          )
          .sigma_serialize_bytes()
      );
      expect(result.inputBoxes).toEqual(paymentTx.inputBoxes);
      expect(result.dataInputs).toEqual(paymentTx.dataInputs);
      expect(result.txType).toEqual(paymentTx.txType);
    });

    /**
     * @target ErgoChain.signTransaction should throw error when signing failed
     * @dependencies
     * @scenario
     * - mock a sign function to throw error
     * - mock PaymentTransaction of unsigned transaction
     * - run test & check thrown exception
     * @expected
     * - it should throw the exact error thrown by sign function
     */
    it('should throw error when signing failed', async () => {
      // mock a sign function to throw error
      const signFunction = async (
        tx: wasm.ReducedTransaction,
        requiredSign: number,
        boxes: Array<wasm.ErgoBox>,
        dataBoxes?: Array<wasm.ErgoBox>
      ): Promise<wasm.Transaction> => {
        throw Error(`TestError: sign failed`);
      };

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = new ErgoTransaction(
        'txId',
        'eventId',
        wasm.ReducedTransaction.sigma_parse_bytes(
          Buffer.from(transactionTestData.transaction2UnsignedSerialized, 'hex')
        ).sigma_serialize_bytes(),
        [],
        [],
        'txType'
      );

      // run test & check thrown exception
      await expect(async () => {
        await ergoChain.signTransaction(paymentTx, 0, signFunction);
      }).rejects.toThrow(`TestError: sign failed`);
    });
  });

  describe('getPaymentTxConfirmationStatus', () => {
    /**
     * @target ErgoChain.getPaymentTxConfirmationStatus should return
     * ConfirmedEnough when tx confirmation is more than expected config
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return enough confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `ConfirmedEnough` enum
     */
    it('should return ConfirmedEnough when tx confirmation is more than expected config', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(paymentTxConfirmation);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getPaymentTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.ConfirmedEnough);
    });

    /**
     * @target ErgoChain.getPaymentTxConfirmationStatus should return
     * NotConfirmedEnough when tx confirmation is less than expected config
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return insufficient confirmation for mocked
     *   txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotConfirmedEnough` enum
     */
    it('should return NotConfirmedEnough when tx confirmation is less than expected config', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(paymentTxConfirmation - 1);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getPaymentTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotConfirmedEnough);
    });

    /**
     * @target ErgoChain.getPaymentTxConfirmationStatus should return
     * NotFound when tx confirmation is -1
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return -1 confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotFound` enum
     */
    it('should return NotFound when tx confirmation is -1', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy).calledWith(txId).mockResolvedValueOnce(-1);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getPaymentTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotFound);
    });
  });

  describe('getColdStorageTxConfirmationStatus', () => {
    /**
     * @target ErgoChain.getColdStorageTxConfirmationStatus should return
     * ConfirmedEnough when tx confirmation is more than expected config
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return enough confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `ConfirmedEnough` enum
     */
    it('should return ConfirmedEnough when tx confirmation is more than expected config', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(coldTxConfirmation);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getColdStorageTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.ConfirmedEnough);
    });

    /**
     * @target ErgoChain.getColdStorageTxConfirmationStatus should return
     * NotConfirmedEnough when tx confirmation is less than expected config
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return insufficient confirmation for mocked
     *   txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotConfirmedEnough` enum
     */
    it('should return NotConfirmedEnough when tx confirmation is less than expected config', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(coldTxConfirmation - 1);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getColdStorageTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotConfirmedEnough);
    });

    /**
     * @target ErgoChain.getColdStorageTxConfirmationStatus should return
     * NotFound when tx confirmation is -1
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return -1 confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotFound` enum
     */
    it('should return NotFound when tx confirmation is -1', async () => {
      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestErgoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy).calledWith(txId).mockResolvedValueOnce(-1);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getColdStorageTxConfirmationStatus(txId);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotFound);
    });
  });

  describe('isTxInMempool', () => {
    /**
     * @target ErgoChain.isTxInMempool should true when tx is in mempool
     * @dependencies
     * @scenario
     * - mock list of transactions
     * - mock a network object to return mocked transactions for mempool
     * - get txId of one of the transactions
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should true when tx is in mempool', async () => {
      // mock list of transactions
      const serializedTransactions: Array<string> = [
        transactionTestData.transaction0,
        transactionTestData.transaction1,
      ].map((txJson) =>
        Buffer.from(
          ergoTestUtils.toTransaction(txJson).sigma_serialize_bytes()
        ).toString('hex')
      );

      // mock a network object to return mocked transactions for mempool
      const network = new TestErgoNetwork();
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      // get txId of one of the transactions
      const txId = ergoTestUtils
        .deserializeTransaction(serializedTransactions[0])
        .id()
        .to_str();

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.isTxInMempool(txId);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target ErgoChain.isTxInMempool should false when tx is NOT in mempool
     * @dependencies
     * @scenario
     * - mock list of transactions
     * - mock a network object to return mocked transactions for mempool
     * - generate a random txId
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should false when tx is NOT in mempool', async () => {
      // mock list of transactions
      const serializedTransactions: Array<string> = [
        transactionTestData.transaction0,
        transactionTestData.transaction1,
      ].map((txJson) =>
        Buffer.from(
          ergoTestUtils.toTransaction(txJson).sigma_serialize_bytes()
        ).toString('hex')
      );

      // mock a network object to return mocked transactions for mempool
      const network = new TestErgoNetwork();
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      // generate a random txId
      const txId = ergoTestUtils.generateRandomId();

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.isTxInMempool(txId);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('getMempoolBoxMapping', () => {
    const trackingAddress =
      'nB3L2PD3LBtiNhDYK7XhZ8nVt6uekBXN7RcPUKgdKLXFcrJiSPxmQsUKuUkTRQ1hbvDrxEQAKYurGFbaGD1RPxU7XqQimD78j23HHMQKL1boUGsnNhCxaVNAYMcFbQNo355Af8cWkhAN6';

    /**
     * @target ErgoChain.getMempoolBoxMapping should construct mapping
     * successfully when no token provided
     * @dependencies
     * @scenario
     * - mock list of transactions with their box mapping
     * - mock a network object to return mocked transactions for mempool
     * - construct trackMap using transaction box mappings
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed trackMap
     */
    it('should construct mapping successfully when no token provided', async () => {
      // mock list of transactions with their box mapping
      const serializedTransactions: Array<string> = [
        transactionTestData.transaction0,
      ].map((txJson) =>
        Buffer.from(
          ergoTestUtils.toTransaction(txJson).sigma_serialize_bytes()
        ).toString('hex')
      );
      const boxMapping = transactionTestData.transaction0BoxMapping;

      // mock a network object to return mocked transactions for mempool
      const network = new TestErgoNetwork();
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      // construct trackMap using transaction box mappings
      const trackMap = new Map<string, string>();
      boxMapping.forEach((mapping) =>
        trackMap.set(mapping.inputId, mapping.serializedOutput)
      );

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getMempoolBoxMapping(trackingAddress);

      // check returned value
      expect(result).toEqual(trackMap);
    });

    /**
     * @target ErgoChain.getMempoolBoxMapping should construct mapping
     * successfully when token provided
     * @dependencies
     * @scenario
     * - mock list of transactions with their box mapping
     * - mock a network object to return mocked transactions for mempool
     * - construct trackMap using transaction box mappings
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed trackMap
     */
    it('should construct mapping successfully when token provided', async () => {
      // mock list of transactions with their box mapping
      const serializedTransactions: Array<string> = [
        transactionTestData.transaction0,
      ].map((txJson) =>
        Buffer.from(
          ergoTestUtils.toTransaction(txJson).sigma_serialize_bytes()
        ).toString('hex')
      );
      const boxMapping = transactionTestData.transaction0BoxMapping;
      const trackingTokenId =
        '03689941746717cddd05c52f454e34eb6e203a84f931fdc47c52f44589f83496';

      // mock a network object to return mocked transactions for mempool
      const network = new TestErgoNetwork();
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      // construct trackMap using transaction box mappings
      const trackMap = new Map<string, string | undefined>();
      boxMapping.forEach((mapping) =>
        trackMap.set(mapping.inputId, mapping.serializedOutput)
      );

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      // check returned value
      expect(result).toEqual(trackMap);
    });

    /**
     * @target ErgoChain.getMempoolBoxMapping should construct mapping
     * successfully when token provided
     * @dependencies
     * @scenario
     * - mock list of transactions with their box mapping
     * - mock a network object to return mocked transactions for mempool
     * - construct trackMap using transaction box mappings (set outputs as
     *   undefined)
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed trackMap
     */
    it('should map inputs to undefined when no valid output box found', async () => {
      // mock list of transactions with their box mapping
      const serializedTransactions: Array<string> = [
        transactionTestData.transaction0,
      ].map((txJson) =>
        Buffer.from(
          ergoTestUtils.toTransaction(txJson).sigma_serialize_bytes()
        ).toString('hex')
      );
      const boxMapping = transactionTestData.transaction0BoxMapping;
      const trackingTokenId =
        '3f3add41746717cddd05c52f454e34eb98424408a931fdc47c52f44f0537f126';

      // mock a network object to return mocked transactions for mempool
      const network = new TestErgoNetwork();
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      // construct trackMap using transaction box mappings
      const trackMap = new Map<string, string | undefined>();
      boxMapping.forEach((mapping) => trackMap.set(mapping.inputId, undefined));

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      // check returned value
      expect(result).toEqual(trackMap);
    });
  });

  describe('getBoxInfo', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.getBoxInfo should get box id and assets successfully
     * @dependencies
     * @scenario
     * - mock an ErgoBox with assets
     * - construct serialized box and BoxInfo
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box id and assets successfully', () => {
      // mock an ErgoBox with assets
      const box = ergoTestUtils.toErgoBox(boxTestData.ergoBox1);
      const serializedBox = Buffer.from(box.sigma_serialize_bytes()).toString(
        'hex'
      );
      const boxInfo: BoxInfo = {
        id: box.box_id().to_str(),
        assets: boxTestData.box1Assets,
      };

      // run test
      const ergoChain = generateChainObject(network);
      const result = ergoChain.getBoxInfo(serializedBox);

      // check returned value
      expect(result).toEqual(boxInfo);
    });
  });
});
