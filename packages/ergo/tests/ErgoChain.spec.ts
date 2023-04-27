import * as boxTestData from './boxTestData';
import * as transactionTestData from './transactionTestData';
import * as ergoTestUtils from './ergoTestUtils';
import { ErgoChain } from '../lib';
import {
  AssetBalance,
  BoxInfo,
  ConfirmationStatus,
  NotEnoughAssetsError,
  NotEnoughValidBoxesError,
  TransactionTypes,
} from '@rosen-chains/abstract-chain';
import TestErgoNetwork from './network/TestErgoNetwork';
import { ErgoConfigs } from '../lib/types';
import { when } from 'jest-when';
import * as wasm from 'ergo-lib-wasm-nodejs';
import ErgoTransaction from '../lib/ErgoTransaction';
import { RosenData } from '@rosen-bridge/rosen-extractor';
import { Fee } from '@rosen-bridge/minimum-fee';

const spyOn = jest.spyOn;

describe('ErgoChain', () => {
  const observationTxConfirmation = 5;
  const paymentTxConfirmation = 9;
  const coldTxConfirmation = 10;
  const rwtId =
    '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
  const generateChainObject = (network: TestErgoNetwork, rwt = rwtId) => {
    const config: ErgoConfigs = {
      fee: 100n,
      observationTxConfirmation: observationTxConfirmation,
      paymentTxConfirmation: paymentTxConfirmation,
      coldTxConfirmation: coldTxConfirmation,
      lockAddress: 'lock_addr',
      coldStorageAddress: 'cold_addr',
      rwtId: rwt,
      minBoxValue: 1000000n,
      eventTxConfirmation: 18,
    };
    return new ErgoChain(network, config);
  };

  describe('generateTransaction', () => {
    /**
     * @target ErgoChain.getTransactionAssets should generate payment
     * transaction successfully
     * @dependencies
     * @scenario
     * - mock transaction order, input and data input boxes
     * - mock an AssetBalance as lock address assets with enough assets
     * - mock a network object
     * --- mock 'getHeight'
     * --- mock 'getStateContext'
     * --- mock 'getAddressAssets' to return mocked assets
     * --- mock 'getMempoolTransactions' to return empty list
     * - mock chain config
     * - mock getCoveringBoxes
     * - run test
     * - check attributes of returned value
     * @expected
     * - PaymentTransaction inputs, dataInputs, eventId and txType should be as
     *   expected
     * - extracted order of generated transaction should be the same as input
     *   order
     * - transaction fee should be the same as config fee
     */
    it('should generate payment transaction successfully', async () => {
      // mock transaction order, input and data input boxes
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const order = transactionTestData.transaction3Order;
      const inputs = [Buffer.from(paymentTx.inputBoxes[0]).toString('hex')];
      const dataInputs = paymentTx.dataInputs.map((serializedBox) =>
        Buffer.from(serializedBox).toString('hex')
      );

      // mock an AssetBalance as lock address assets with enough assets
      const mockedLockAssets = {
        nativeToken: 50000000n,
        tokens: [
          {
            id: '10278c102bf890fdab8ef5111e94053c90b3541bc25b0de2ee8aa6305ccec3de',
            value: 5000n,
          },
          {
            id: ergoTestUtils.generateRandomId(),
            value: 100000n,
          },
        ],
      };

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getHeight'
      const getHeightSpy = spyOn(network, 'getHeight');
      getHeightSpy.mockResolvedValue(966000);
      // mock 'getStateContext'
      const getStateContextSpy = spyOn(network, 'getStateContext');
      getStateContextSpy.mockResolvedValue(
        transactionTestData.mockedStateContext
      );
      // mock 'getAddressAssets' to return mocked assets
      const getAddressAssetsSpy = spyOn(network, 'getAddressAssets');
      getAddressAssetsSpy.mockResolvedValue(mockedLockAssets);
      // mock 'getMempoolTransactions'
      const getMempoolTransactionsSpy = spyOn(
        network,
        'getMempoolTransactions'
      );
      getMempoolTransactionsSpy.mockResolvedValue([]);

      // mock chain config
      const config: ErgoConfigs = {
        fee: 1100000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress:
          'nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 300000n,
        eventTxConfirmation: 18,
      };

      // mock getCoveringBoxes
      const ergoChain = new ErgoChain(network, config);
      const getCoveringBoxesSpy = spyOn(ergoChain, 'getCoveringBoxes');
      getCoveringBoxesSpy.mockResolvedValue({
        covered: true,
        boxes: paymentTx.inputBoxes
          .slice(1)
          .map((serializedBox) => Buffer.from(serializedBox).toString('hex')),
      });

      // run test
      const result = await ergoChain.generateTransaction(
        paymentTx.eventId,
        paymentTx.txType,
        order,
        [],
        [],
        inputs,
        dataInputs
      );

      // check returned value
      //  PaymentTransaction inputs, dataInputs, eventId and txType should be as expected
      const ergoTx = result as ErgoTransaction;
      expect(ergoTx.inputBoxes).toEqual(paymentTx.inputBoxes);
      expect(ergoTx.dataInputs).toEqual(paymentTx.dataInputs);
      expect(ergoTx.eventId).toEqual(paymentTx.eventId);
      expect(ergoTx.txType).toEqual(paymentTx.txType);
      //  extracted order of generated transaction should be the same as input order
      const extractedOrder = ergoChain.extractTransactionOrder(result);
      expect(extractedOrder).toEqual(order);
      //  transaction fee should be the same as config fee
      const tx = wasm.ReducedTransaction.sigma_parse_bytes(
        result.txBytes
      ).unsigned_tx();
      let boxChecked = false;
      for (let i = 0; i < tx.output_candidates().len(); i++) {
        if (
          tx.output_candidates().get(i).ergo_tree().to_base16_bytes() ===
          ErgoChain.feeBoxErgoTree
        ) {
          expect(
            BigInt(tx.output_candidates().get(i).value().as_i64().to_str())
          ).toEqual(config.fee);
          boxChecked = true;
        }
      }
      expect(boxChecked).toEqual(true);
    });

    /**
     * @target ErgoChain.getTransactionAssets should throw appropriate
     * error when locked assets are not enough to generate transaction
     * @dependencies
     * @scenario
     * - mock transaction order, input and data input boxes
     * - mock an AssetBalance as lock address assets lacking enough assets
     * - mock a network object
     * --- mock 'getHeight'
     * --- mock 'getStateContext'
     * --- mock 'getAddressAssets' to return mocked assets
     * - mock chain config
     * - run test and expect exception thrown
     * @expected
     * - it should thrown NotEnoughAssetsError
     */
    it('should throw appropriate error when locked assets are not enough to generate transaction', async () => {
      // mock transaction order, input and data input boxes
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const order = transactionTestData.transaction3Order;
      const inputs = [Buffer.from(paymentTx.inputBoxes[0]).toString('hex')];
      const dataInputs = paymentTx.dataInputs.map((serializedBox) =>
        Buffer.from(serializedBox).toString('hex')
      );

      // mock an AssetBalance as lock address assets lacking enough assets
      const mockedLockAssets = {
        nativeToken: 1000000n,
        tokens: [],
      };

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getHeight'
      const getHeightSpy = spyOn(network, 'getHeight');
      getHeightSpy.mockResolvedValue(966000);
      // mock 'getStateContext'
      const getStateContextSpy = spyOn(network, 'getStateContext');
      getStateContextSpy.mockResolvedValue(
        transactionTestData.mockedStateContext
      );
      // mock 'getAddressAssets' to return mocked assets
      const getAddressAssetsSpy = spyOn(network, 'getAddressAssets');
      getAddressAssetsSpy.mockResolvedValue(mockedLockAssets);

      // mock chain config
      const config: ErgoConfigs = {
        fee: 1100000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress:
          'nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 300000n,
        eventTxConfirmation: 18,
      };

      // run test and expect exception thrown
      const ergoChain = new ErgoChain(network, config);
      await expect(async () => {
        await ergoChain.generateTransaction(
          paymentTx.eventId,
          paymentTx.txType,
          order,
          [],
          [],
          inputs,
          dataInputs
        );
      }).rejects.toThrow(NotEnoughAssetsError);
    });

    /**
     * @target ErgoChain.getTransactionAssets should throw appropriate
     * error when available boxes cannot cover required assets to generate
     * transaction
     * @dependencies
     * @scenario
     * - mock transaction order, input and data input boxes
     * - mock an AssetBalance as lock address assets with enough assets
     * - mock a network object
     * --- mock 'getHeight'
     * --- mock 'getStateContext'
     * --- mock 'getAddressAssets' to return mocked assets
     * --- mock 'getMempoolTransactions' to return empty list
     * - mock chain config
     * - mock getCoveringBoxes to return NOT covered
     * - run test and expect exception thrown
     * @expected
     * - it should thrown NotEnoughValidBoxesError
     */
    it('should throw appropriate error when available boxes cannot cover required assets to generate transaction', async () => {
      // mock transaction order, input and data input boxes
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const order = transactionTestData.transaction3Order;
      const inputs = [Buffer.from(paymentTx.inputBoxes[0]).toString('hex')];
      const dataInputs = paymentTx.dataInputs.map((serializedBox) =>
        Buffer.from(serializedBox).toString('hex')
      );

      // mock an AssetBalance as lock address assets with enough assets
      const mockedLockAssets = {
        nativeToken: 50000000n,
        tokens: [
          {
            id: '10278c102bf890fdab8ef5111e94053c90b3541bc25b0de2ee8aa6305ccec3de',
            value: 5000n,
          },
          {
            id: ergoTestUtils.generateRandomId(),
            value: 100000n,
          },
        ],
      };

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getHeight'
      const getHeightSpy = spyOn(network, 'getHeight');
      getHeightSpy.mockResolvedValue(966000);
      // mock 'getStateContext'
      const getStateContextSpy = spyOn(network, 'getStateContext');
      getStateContextSpy.mockResolvedValue(
        transactionTestData.mockedStateContext
      );
      // mock 'getAddressAssets' to return mocked assets
      const getAddressAssetsSpy = spyOn(network, 'getAddressAssets');
      getAddressAssetsSpy.mockResolvedValue(mockedLockAssets);
      // mock 'getMempoolTransactions'
      const getMempoolTransactionsSpy = spyOn(
        network,
        'getMempoolTransactions'
      );
      getMempoolTransactionsSpy.mockResolvedValue([]);

      // mock chain config
      const config: ErgoConfigs = {
        fee: 1100000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress:
          'nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 300000n,
        eventTxConfirmation: 18,
      };

      // mock getCoveringBoxes
      const ergoChain = new ErgoChain(network, config);
      const getCoveringBoxesSpy = spyOn(ergoChain, 'getCoveringBoxes');
      getCoveringBoxesSpy.mockResolvedValue({
        covered: false,
        boxes: paymentTx.inputBoxes
          .slice(1, 2)
          .map((serializedBox) => Buffer.from(serializedBox).toString('hex')),
      });

      // run test and expect exception thrown
      await expect(async () => {
        await ergoChain.generateTransaction(
          paymentTx.eventId,
          paymentTx.txType,
          order,
          [],
          [],
          inputs,
          dataInputs
        );
      }).rejects.toThrow(NotEnoughValidBoxesError);
    });

    /**
     * @target ErgoChain.getTransactionAssets should filter boxes that
     * are used in unsigned transactions successfully
     * @dependencies
     * @scenario
     * - mock transaction order, input and data input boxes
     * - mock an unsigned transaction with it's input boxes
     * - mock an AssetBalance as lock address assets with enough assets
     * - mock a network object
     * --- mock 'getHeight'
     * --- mock 'getStateContext'
     * --- mock 'getAddressAssets' to return mocked assets
     * --- mock 'getMempoolTransactions' to return empty list
     * - mock chain config
     * - mock getCoveringBoxes
     * --- returns NOT covered when forbiddenBoxIds argument contains
     *     right ids
     * --- otherwise returns covered
     * - run test and expect exception thrown
     * @expected
     * - it should thrown NotEnoughValidBoxesError
     */
    it('should throw appropriate error when available boxes cannot cover required assets to generate transaction', async () => {
      // mock transaction order, input and data input boxes
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const order = transactionTestData.transaction3Order;
      const inputs = [Buffer.from(paymentTx.inputBoxes[0]).toString('hex')];
      const dataInputs = paymentTx.dataInputs.map((serializedBox) =>
        Buffer.from(serializedBox).toString('hex')
      );

      // mock an unsigned transaction with it's input boxess
      const unsignedTransaction = ErgoTransaction.fromJson(
        transactionTestData.transaction2PartialUnsignedPaymentTransaction
      );
      const unsignedTxInputBoxIds = transactionTestData.transaction2InputBoxIds;

      // mock an AssetBalance as lock address assets with enough assets
      const mockedLockAssets = {
        nativeToken: 50000000n,
        tokens: [
          {
            id: '10278c102bf890fdab8ef5111e94053c90b3541bc25b0de2ee8aa6305ccec3de',
            value: 5000n,
          },
          {
            id: ergoTestUtils.generateRandomId(),
            value: 100000n,
          },
        ],
      };

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getHeight'
      const getHeightSpy = spyOn(network, 'getHeight');
      getHeightSpy.mockResolvedValue(966000);
      // mock 'getStateContext'
      const getStateContextSpy = spyOn(network, 'getStateContext');
      getStateContextSpy.mockResolvedValue(
        transactionTestData.mockedStateContext
      );
      // mock 'getAddressAssets' to return mocked assets
      const getAddressAssetsSpy = spyOn(network, 'getAddressAssets');
      getAddressAssetsSpy.mockResolvedValue(mockedLockAssets);
      // mock 'getMempoolTransactions'
      const getMempoolTransactionsSpy = spyOn(
        network,
        'getMempoolTransactions'
      );
      getMempoolTransactionsSpy.mockResolvedValue([]);

      // mock chain config
      const config: ErgoConfigs = {
        fee: 1100000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress:
          'nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 300000n,
        eventTxConfirmation: 18,
      };

      // mock getCoveringBoxes
      const ergoChain = new ErgoChain(network, config);
      const getCoveringBoxesSpy = spyOn(ergoChain, 'getCoveringBoxes');
      getCoveringBoxesSpy.mockImplementation(
        async (
          address: string,
          requiredAssets: AssetBalance,
          forbiddenBoxIds: Array<string>,
          trackMap: Map<string, string | undefined>
        ) => {
          // returns NOT covered when forbiddenBoxIds argument equals to expected value
          if (
            forbiddenBoxIds.length === 1 &&
            forbiddenBoxIds[0] === unsignedTxInputBoxIds[0]
          )
            return {
              covered: false,
              boxes: [],
            };
          // otherwise returns covered
          else
            return {
              covered: true,
              boxes: paymentTx.inputBoxes
                .slice(1)
                .map((serializedBox) =>
                  Buffer.from(serializedBox).toString('hex')
                ),
            };
        }
      );

      // run test and expect exception thrown
      await expect(async () => {
        await ergoChain.generateTransaction(
          paymentTx.eventId,
          paymentTx.txType,
          order,
          [unsignedTransaction],
          [],
          inputs,
          dataInputs
        );
      }).rejects.toThrow(NotEnoughValidBoxesError);
    });
  });

  describe('getTransactionAssets', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.getTransactionAssets should get transaction assets
     * successfully
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - run test
     * - check returned value
     * @expected
     * - it should return mocked transaction assets
     */
    it('should get transaction assets successfully', () => {
      // mock PaymentTransaction
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const expectedAssets = transactionTestData.transaction3Assets;

      // run test
      const ergoChain = generateChainObject(network);
      const result = ergoChain.getTransactionAssets(paymentTx);

      // check returned value
      expect(result).toEqual(expectedAssets);
    });
  });

  describe('extractTransactionOrder', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.extractTransactionOrder should extract transaction
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
      const paymentTx = ErgoTransaction.fromJson(
        transactionTestData.transaction3PaymentTransaction
      );
      const expectedOrder = transactionTestData.transaction3Order;
      const config: ErgoConfigs = {
        fee: 1100000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress:
          'nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 1000000n,
        eventTxConfirmation: 18,
      };

      // run test
      const ergoChain = new ErgoChain(network, config);
      const result = ergoChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(expectedOrder);
    });
  });

  describe('verifyTransactionFee', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.verifyTransactionFee should return true when fee is
     * less than config fee
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a config that has more fee comparing to mocked transaction fee
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when fee is less than config fee', async () => {
      // mock PaymentTransaction
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

      // mock a config that has more fee comparing to mocked transaction fee
      const config: ErgoConfigs = {
        fee: 1200000n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress: 'lock_addr',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 1000000n,
        eventTxConfirmation: 18,
      };

      // run test
      const ergoChain = new ErgoChain(network, config);
      const result = await ergoChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target ErgoChain.verifyTransactionFee should return false when fee is
     * more than config fee
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a config that has less fee comparing to mocked transaction fee
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when fee is more than config fee', async () => {
      // mock PaymentTransaction
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

      // mock a config that has less fee comparing to mocked transaction fee
      const config: ErgoConfigs = {
        fee: 100n,
        observationTxConfirmation: observationTxConfirmation,
        paymentTxConfirmation: paymentTxConfirmation,
        coldTxConfirmation: coldTxConfirmation,
        lockAddress: 'lock_addr',
        coldStorageAddress: 'cold_addr',
        rwtId: rwtId,
        minBoxValue: 1000000n,
        eventTxConfirmation: 18,
      };

      // run test
      const ergoChain = new ErgoChain(network, config);
      const result = await ergoChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('verifyEvent', () => {
    const serializedEventBox = Buffer.from(
      ergoTestUtils.toErgoBox(boxTestData.eventBox1).sigma_serialize_bytes()
    ).toString('hex');
    const feeConfig: Fee = {
      bridgeFee: 0n,
      networkFee: 0n,
      rsnRatio: 0n,
    };

    /**
     * @target ErgoChain.verifyEvent should return true when event is valid
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when event is valid', async () => {
      // mock an event
      const event = boxTestData.validEvent;

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getBlockTransactionIds'
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          ergoTestUtils.generateRandomId(),
          event.sourceTxId,
          ergoTestUtils.generateRandomId(),
        ]);
      // mock 'getTransaction'
      const serializedTx = 'serializedTransaction';
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(serializedTx);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      when(extractorSpy)
        .calledWith(serializedTx)
        .mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.verifyEvent(
        event,
        serializedEventBox,
        feeConfig
      );

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target ErgoChain.verifyEvent should return false when rwt token id is
     * invalid
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when rwt token id is invalid', async () => {
      // mock an event
      const event = boxTestData.validEvent;

      // mock a network object
      const network = new TestErgoNetwork();

      // run test
      const ergoChain = generateChainObject(network, 'fake_rwt_id');
      const result = await ergoChain.verifyEvent(
        event,
        serializedEventBox,
        feeConfig
      );

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ErgoChain.verifyEvent should return false when event transaction
     * is not in event block
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds'
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when event transaction is not in event block', async () => {
      // mock an event
      const event = boxTestData.validEvent;

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getBlockTransactionIds'
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          ergoTestUtils.generateRandomId(),
          ergoTestUtils.generateRandomId(),
        ]);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.verifyEvent(
        event,
        serializedEventBox,
        feeConfig
      );

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ErgoChain.verifyEvent should return false when a field of event
     * is wrong
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data (expect for a key which
     *   should be wrong)
     * - run test
     * - check returned value
     * @expected
     * - it should return false
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
      const event = boxTestData.validEvent;

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getBlockTransactionIds'
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          ergoTestUtils.generateRandomId(),
          ergoTestUtils.generateRandomId(),
        ]);
      // mock 'getTransaction'
      const serializedTx = 'serializedTransaction';
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(serializedTx);

      // mock network extractor to return event data (expect for a key which should be wrong)
      const invalidData = event as unknown as RosenData;
      invalidData[key as keyof RosenData] = `fake_${key}`;
      const extractorSpy = spyOn(network.extractor, 'get');
      when(extractorSpy)
        .calledWith(serializedTx)
        .mockReturnValueOnce(invalidData);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.verifyEvent(
        event,
        serializedEventBox,
        feeConfig
      );

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ErgoChain.verifyEvent should return false when sum of event fees
     * is less than event amount
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when sum of event fees is less than event amount', async () => {
      // mock an event
      const event = boxTestData.invalidEvent;

      // mock a network object
      const network = new TestErgoNetwork();
      // mock 'getBlockTransactionIds'
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          ergoTestUtils.generateRandomId(),
          event.sourceTxId,
          ergoTestUtils.generateRandomId(),
        ]);
      // mock 'getTransaction'
      const serializedTx = 'serializedTransaction';
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(serializedTx);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      when(extractorSpy)
        .calledWith(serializedTx)
        .mockReturnValueOnce(event as unknown as RosenData);

      // run test
      const ergoChain = generateChainObject(network);
      const result = await ergoChain.verifyEvent(
        event,
        serializedEventBox,
        feeConfig
      );

      // check returned value
      expect(result).toEqual(false);
    });
  });

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

  describe('getTxConfirmationStatus', () => {
    /**
     * gets test confirmation config for a transaction by type
     * @param type
     */
    const getConfigConfirmation = (type: string): number => {
      if (type === TransactionTypes.payment) return paymentTxConfirmation;
      else if (type === TransactionTypes.reward) return paymentTxConfirmation;
      else if (type === TransactionTypes.coldStorage) return coldTxConfirmation;
      else if (type === TransactionTypes.lock) return observationTxConfirmation;
      else throw new Error(`Transaction type [${type}] is not defined`);
    };

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
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
    it.each([
      TransactionTypes.payment,
      TransactionTypes.reward,
      TransactionTypes.coldStorage,
      TransactionTypes.lock,
    ])(
      'should return ConfirmedEnough when %p tx confirmation is more than expected config',
      async (txType: string) => {
        // generate a random txId
        const txId = ergoTestUtils.generateRandomId();

        // mock a network object to return enough confirmation for mocked txId
        const network = new TestErgoNetwork();
        const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
        when(getTxConfirmationSpy)
          .calledWith(txId)
          .mockResolvedValueOnce(getConfigConfirmation(txType));

        // run test
        const ergoChain = generateChainObject(network);
        const result = await ergoChain.getTxConfirmationStatus(txId, txType);

        // check returned value
        expect(result).toEqual(ConfirmationStatus.ConfirmedEnough);
      }
    );

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
     * NotConfirmedEnough when payment tx confirmation is less than expected config
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
    it.each([
      TransactionTypes.payment,
      TransactionTypes.reward,
      TransactionTypes.coldStorage,
      TransactionTypes.lock,
    ])(
      'should return NotConfirmedEnough when %p tx confirmation is less than expected config',
      async (txType: string) => {
        // generate a random txId
        const txId = ergoTestUtils.generateRandomId();

        // mock a network object to return insufficient confirmation for mocked
        const network = new TestErgoNetwork();
        const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
        when(getTxConfirmationSpy)
          .calledWith(txId)
          .mockResolvedValueOnce(getConfigConfirmation(txType) - 1);

        // run test
        const ergoChain = generateChainObject(network);
        const result = await ergoChain.getTxConfirmationStatus(txId, txType);

        // check returned value
        expect(result).toEqual(ConfirmationStatus.NotConfirmedEnough);
      }
    );

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
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
      const result = await ergoChain.getTxConfirmationStatus(
        txId,
        TransactionTypes.payment
      );

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

  describe('getBoxHeight', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.getBoxHeight should get box height successfully
     * @dependencies
     * @scenario
     * - mock an ErgoBox and construct serialized box
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box height successfully', () => {
      // mock an ErgoBox and construct serialized box
      const box = ergoTestUtils.toErgoBox(boxTestData.ergoBox1);
      const serializedBox = Buffer.from(box.sigma_serialize_bytes()).toString(
        'hex'
      );

      // run test
      const ergoChain = generateChainObject(network);
      const result = ergoChain.getBoxHeight(serializedBox);

      // check returned value
      expect(result).toEqual(box.creation_height());
    });
  });

  describe('getBoxWID', () => {
    const network = new TestErgoNetwork();

    /**
     * @target ErgoChain.getBoxWID should get box WID successfully
     * @dependencies
     * @scenario
     * - mock an ErgoBox with WID and construct serialized box
     * - run test
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box WID successfully', () => {
      // mock an ErgoBox with WID and construct serialized box
      const box = ergoTestUtils.toErgoBox(boxTestData.ergoBox2);
      const serializedBox = Buffer.from(box.sigma_serialize_bytes()).toString(
        'hex'
      );
      const wid =
        '97a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247';

      // run test
      const ergoChain = generateChainObject(network);
      const result = ergoChain.getBoxWID(serializedBox);

      // check returned value
      expect(result).toEqual(wid);
    });

    /**
     * @target ErgoChain.getBoxWID should throw Error when box has no WID
     * @dependencies
     * @scenario
     * - mock an ErgoBox without WID and construct serialized box
     * - run test and expect exception thrown
     * @expected
     * - it should throw Error
     */
    it('should throw Error when box has no WID', () => {
      // mock an ErgoBox without WID and construct serialized box
      const box = ergoTestUtils.toErgoBox(boxTestData.ergoBox1);
      const serializedBox = Buffer.from(box.sigma_serialize_bytes()).toString(
        'hex'
      );

      // run test and expect exception thrown
      const ergoChain = generateChainObject(network);
      expect(() => {
        ergoChain.getBoxWID(serializedBox);
      }).toThrow(Error);
    });
  });
});
