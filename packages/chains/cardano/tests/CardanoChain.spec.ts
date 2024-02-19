import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';
import TestCardanoNetwork from './network/TestCardanoNetwork';
import CardanoChain from '../lib/CardanoChain';
import { CardanoBoxCandidate, CardanoConfigs, CardanoUtxo } from '../lib';
import * as TestData from './testData';
import * as TestUtils from './testUtils';
import CardanoTransaction from '../lib/CardanoTransaction';
import { when } from 'jest-when';
import CardanoUtils from '../lib/CardanoUtils';
import {
  ConfirmationStatus,
  NotEnoughAssetsError,
  NotEnoughValidBoxesError,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { Fee } from '@rosen-bridge/minimum-fee';
import { RosenData } from '@rosen-bridge/rosen-extractor';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';
import JsonBI from '@rosen-bridge/json-bigint';
import Serializer from '../lib/Serializer';
import JsonBigInt from '@rosen-bridge/json-bigint';

const spyOn = jest.spyOn;

describe('CardanoChain', () => {
  const observationTxConfirmation = 5;
  const paymentTxConfirmation = 9;
  const coldTxConfirmation = 10;
  const manualTxConfirmation = 11;
  const rwtId =
    '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
  const feeRationDivisor = 1n;
  const minBoxValue = 2000000n;
  const configs: CardanoConfigs = {
    fee: 1000000n,
    minBoxValue: minBoxValue,
    txTtl: 64,
    addresses: {
      lock: 'addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs',
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
    aggregatedPublicKey:
      'bcb07faa6c0f19e2f2587aa9ef6f43a68fc0135321216a71dc87c8527af4ca6a',
  };
  const rosenTokens: RosenTokens = JSON.parse(TestData.testTokenMap);
  const tokenMap = new TokenMap(rosenTokens);
  const bankBoxes = TestUtils.mockBankBoxes();
  const mockedSignFn = () => Promise.resolve('');
  const generateChainObject = (
    network: TestCardanoNetwork,
    signFn: (txHash: Uint8Array) => Promise<string> = mockedSignFn
  ) => {
    return new CardanoChain(
      network,
      configs,
      tokenMap,
      feeRationDivisor,
      signFn
    );
  };

  describe('generateTransaction', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.generateTransaction should generate payment
     * transaction successfully
     * @dependencies
     * @scenario
     * - mock transaction order, currentSlot
     * - mock getCoveringBoxes, hasLockAddressEnoughAssets
     * - call the function
     * - check returned value
     * @expected
     * - PaymentTransaction txType, eventId, network and inputUtxos should be as
     *   expected
     * - extracted order of generated transaction should be the same as input
     *   order
     * - transaction fee and ttl should be the same as config fee
     * - getCoveringBoxes should have been called with correct arguments
     */
    it('should generate payment transaction successfully', async () => {
      // mock transaction order, currentSlot
      const order = TestData.transaction1Order;
      const payment1 = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );
      const getSlotSpy = spyOn(network, 'currentSlot');
      getSlotSpy.mockResolvedValue(100);

      // mock getCoveringBoxes, hasLockAddressEnoughAssets
      const cardanoChain = generateChainObject(network);
      const getCovBoxesSpy = spyOn(cardanoChain, 'getCoveringBoxes');
      getCovBoxesSpy.mockResolvedValue({
        covered: true,
        boxes: bankBoxes,
      });
      const hasLockAddressEnoughAssetsSpy = spyOn(
        cardanoChain,
        'hasLockAddressEnoughAssets'
      );
      hasLockAddressEnoughAssetsSpy.mockResolvedValue(true);

      // call the function
      const result = await cardanoChain.generateTransaction(
        payment1.eventId,
        payment1.txType,
        order,
        [CardanoTransaction.fromJson(TestData.transaction1PaymentTransaction)],
        []
      );
      const cardanoTx = result as CardanoTransaction;

      // check returned value
      expect(cardanoTx.txType).toEqual(payment1.txType);
      expect(cardanoTx.eventId).toEqual(payment1.eventId);
      expect(cardanoTx.network).toEqual(payment1.network);
      expect(cardanoTx.inputUtxos).toEqual(
        bankBoxes.map((utxo) => JsonBI.stringify(utxo))
      );

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = cardanoChain.extractTransactionOrder(cardanoTx);
      expect(extractedOrder).toEqual(order);

      // transaction fee and ttl should be the same as input configs
      const tx = Transaction.from_bytes(cardanoTx.txBytes);
      expect(tx.body().fee().to_str()).toEqual(configs.fee.toString());
      expect(tx.body().ttl()).toEqual(164);

      // getCoveringBoxes should have been called with correct arguments
      const expectedRequiredAssets = structuredClone(
        TestData.transaction1Order[0].assets
      );
      expectedRequiredAssets.nativeToken += minBoxValue + configs.fee;
      expect(getCovBoxesSpy).toHaveBeenCalledWith(
        configs.addresses.lock,
        expectedRequiredAssets,
        TestData.transaction1InputIds,
        new Map()
      );
    });

    /**
     * @target CardanoChain.generateTransaction should generate payment
     * transaction successfully with special tokens
     * @dependencies
     * @scenario
     * - mock transaction order, currentSlot
     * - mock getCoveringBoxes, hasLockAddressEnoughAssets
     * - call the function
     * - check returned value
     * @expected
     * - PaymentTransaction txType, eventId, network and inputUtxos should be as
     *   expected
     * - extracted order of generated transaction should be the same as input
     *   order
     * - transaction fee and ttl should be the same as config fee
     * - tokens with same policyId and should put correctly
     */
    it('should generate payment transaction successfully with special tokens', async () => {
      // mock transaction order, currentSlot
      const order = TestData.transaction4Order;
      const payment = CardanoTransaction.fromJson(
        TestData.transaction4PaymentTransaction
      );
      const getSlotSpy = spyOn(network, 'currentSlot');
      getSlotSpy.mockResolvedValue(200);

      // mock getCoveringBoxes, hasLockAddressEnoughAssets
      const cardanoChain = generateChainObject(network);
      const getCovBoxesSpy = spyOn(cardanoChain, 'getCoveringBoxes');
      getCovBoxesSpy.mockResolvedValue({
        covered: true,
        boxes: bankBoxes.slice(2),
      });
      const hasLockAddressEnoughAssetsSpy = spyOn(
        cardanoChain,
        'hasLockAddressEnoughAssets'
      );
      hasLockAddressEnoughAssetsSpy.mockResolvedValue(true);

      // call the function
      const result = await cardanoChain.generateTransaction(
        '2bedc6e54ede7748e5efc7df689a0a89b281ac1d92d09054650d5f27a25d5b85',
        TransactionType.payment,
        order,
        [],
        []
      );
      const cardanoTx = result as CardanoTransaction;

      // check returned value
      expect(cardanoTx.txType).toEqual(payment.txType);
      expect(cardanoTx.eventId).toEqual(payment.eventId);
      expect(cardanoTx.network).toEqual(payment.network);
      expect(cardanoTx.inputUtxos).toEqual(
        bankBoxes.slice(2).map((utxo) => JsonBI.stringify(utxo))
      );

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = cardanoChain.extractTransactionOrder(cardanoTx);
      expect(extractedOrder).toEqual(order);

      // transaction fee and ttl should be the same as input configs
      const tx = Transaction.from_bytes(cardanoTx.txBytes);
      expect(tx.body().fee().to_str()).toEqual(configs.fee.toString());
      expect(tx.body().ttl()).toEqual(264);

      // tokens with same policyId and should put correctly
      expect(
        tx.body().outputs().get(1).amount().multiasset()!.to_json()
      ).toEqual(TestData.transaction4ChangeBoxMultiAssets.trim());
    });

    /**
     * @target CardanoChain.generateTransaction should throw error
     * when lock address does not have enough assets
     * @dependencies
     * @scenario
     * - mock hasLockAddressEnoughAssets
     * - call the function and expect error
     * @expected
     * - generateTransaction should throw NotEnoughAssetsError
     */
    it('should throw error when lock address does not have enough assets', async () => {
      // mock hasLockAddressEnoughAssets
      const cardanoChain = generateChainObject(network);
      const hasLockAddressEnoughAssetsSpy = spyOn(
        cardanoChain,
        'hasLockAddressEnoughAssets'
      );
      hasLockAddressEnoughAssetsSpy.mockResolvedValue(false);

      // call the function and expect error
      await expect(async () => {
        await cardanoChain.generateTransaction(
          'event1',
          TransactionType.payment,
          TestData.transaction1Order,
          [],
          []
        );
      }).rejects.toThrow(NotEnoughAssetsError);
    });

    /**
     * @target CardanoChain.generateTransaction should throw error
     * when bank boxes can not cover order assets
     * @dependencies
     * @scenario
     * - mock getCoveringBoxes, hasLockAddressEnoughAssets
     * - call the function and expect error
     * @expected
     * - generateTransaction should throw NotEnoughAssetsError
     */
    it('should throw error when bank boxes can not cover order assets', async () => {
      // mock getCoveringBoxes, hasLockAddressEnoughAssets
      const cardanoChain = generateChainObject(network);
      const getCovBoxesSpy = spyOn(cardanoChain, 'getCoveringBoxes');
      getCovBoxesSpy.mockResolvedValue({
        covered: false,
        boxes: bankBoxes,
      });
      const hasLockAddressEnoughAssetsSpy = spyOn(
        cardanoChain,
        'hasLockAddressEnoughAssets'
      );
      hasLockAddressEnoughAssetsSpy.mockResolvedValue(true);

      // call the function and expect error
      await expect(async () => {
        await cardanoChain.generateTransaction(
          'event1',
          TransactionType.payment,
          TestData.transaction1Order,
          [],
          []
        );
      }).rejects.toThrow(NotEnoughValidBoxesError);
    });
  });

  describe('extractTransactionOrder', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.extractTransactionOrder should extract transaction
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
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );
      const expectedOrder = TestData.transaction1Order;

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = cardanoChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(expectedOrder);
    });
  });

  describe('getBoxInfo', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.getBoxInfo should get box id and assets correctly
     * @dependencies
     * @scenario
     * - mock a CardanoBox with assets
     * - call the function
     * - check returned value
     * @expected
     * - it should return constructed BoxInfo
     */
    it('should get box info successfully', async () => {
      // mock a CardanoBox with assets
      const rawBox = bankBoxes[0];

      // call the function
      const cardanoChain = generateChainObject(network);

      // check returned value
      const result = await cardanoChain.getBoxInfo(rawBox);
      expect(result.id).toEqual(rawBox.txId + '.' + rawBox.index);
      expect(result.assets.nativeToken.toString()).toEqual(
        rawBox.value.toString()
      );
    });
  });

  describe('signTransaction', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.signTransaction should return PaymentTransaction of the
     * signed transaction
     * @dependencies
     * @scenario
     * - mock a sign function to return signature
     * - mock PaymentTransaction of unsigned transaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return PaymentTransaction of signed transaction (all fields
     *   are same as input object, except txBytes which is signed transaction)
     */
    it('should return PaymentTransaction of the signed transaction', async () => {
      // mock a sign function to return signature
      const signFunction = async (txHash: Uint8Array): Promise<string> => {
        return '4d9794972a26d36ebc35c819ef3c8eea80bd451e497ac89a7303dd3025714cb235fcad6621778fdbd99b56753e6493ea646ac7ade8f30fed7dca7138c741fe02';
      };

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network, signFunction);
      const result = await cardanoChain.signTransaction(paymentTx, 0);

      // check returned value
      expect(result.txId).toEqual(paymentTx.txId);
      expect(result.txType).toEqual(paymentTx.txType);
      expect(result.eventId).toEqual(paymentTx.eventId);
      expect(result.network).toEqual(paymentTx.network);
    });

    /**
     * @target CardanoChain.signTransaction should throw error when signing failed
     * @dependencies
     * @scenario
     * - mock a sign function to throw error
     * - mock PaymentTransaction of unsigned transaction
     * - call the function & check thrown exception
     * @expected
     * - it should throw the exact error thrown by sign function
     */
    it('should throw error when signing failed', async () => {
      // mock a sign function to throw error
      const signFunction = async (txHash: Uint8Array): Promise<string> => {
        throw Error(`TestError: sign failed`);
      };

      // mock PaymentTransaction of unsigned transaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network, signFunction);

      await expect(async () => {
        await cardanoChain.signTransaction(paymentTx, 0);
      }).rejects.toThrow('TestError: sign failed');
    });
  });

  describe('getTransactionAssets', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.getTransactionAssets should get transaction assets
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
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);

      // check returned value
      const result = await cardanoChain.getTransactionAssets(paymentTx);
      expect(result.inputAssets).toEqual(TestData.transaction1InputAssets);
      expect(result.outputAssets).toEqual(TestData.transaction1Assets);
    });

    /**
     * @target CardanoChain.getTransactionAssets should skip duplicate inputs
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return mocked transaction assets (both input and output assets)
     */
    it('should skip duplicate inputs', async () => {
      // mock PaymentTransaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction6PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);

      // check returned value
      const result = await cardanoChain.getTransactionAssets(paymentTx);
      expect(result.inputAssets).toEqual(TestData.transaction6InputAssets);
    });
  });

  describe('getMempoolBoxMapping', () => {
    const network = new TestCardanoNetwork();
    const trackingAddress =
      'addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w';

    /**
     * @target CardanoChain.getMempoolBoxMapping should construct mapping
     * successfully when no token provided
     * @dependencies
     * @scenario
     * - mock getMempoolTransactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map equal to constructed map
     */
    it('should construct mapping successfully when no token provided', async () => {
      // mock getMempoolTransactions
      const transactions = [TestData.cardanoTx1];
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getMempoolBoxMapping(trackingAddress);

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      trackMap.set(CardanoUtils.getBoxId(TestData.cardanoTx1.inputs[0]), {
        txId: TestData.cardanoTx1.id,
        index: 0,
        value: TestData.cardanoTx1.outputs[0].value,
        assets: TestData.cardanoTx1.outputs[0].assets,
      });
      expect(result).toEqual(trackMap);
    });

    /**
     * @target CardanoChain.getMempoolBoxMapping should construct mapping
     * successfully when token provided
     * @dependencies
     * @scenario
     * - mock getMempoolTransactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map equal to constructed map
     */
    it('should construct mapping successfully when token provided', async () => {
      // mock getMempoolTransactions
      const transactions = [TestData.cardanoTx1];
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );

      // call the function
      const trackingTokenId =
        'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235.484f534b59';
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      trackMap.set(CardanoUtils.getBoxId(TestData.cardanoTx1.inputs[0]), {
        txId: TestData.cardanoTx1.id,
        index: 0,
        value: TestData.cardanoTx1.outputs[0].value,
        assets: TestData.cardanoTx1.outputs[0].assets,
      });
      expect(result).toEqual(trackMap);
    });

    /**
     * @target CardanoChain.getMempoolBoxMapping should map inputs to
     * undefined when no valid output box found
     * @dependencies
     * @scenario
     * - mock getMempoolTransactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map of each box to undefined
     */
    it('should map inputs to undefined when no valid output box found', async () => {
      // mock getMempoolTransactions
      const transactions = [TestData.cardanoTx1];
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );

      // call the function
      const trackingTokenId =
        '48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b.5273744572676f546f6b656e7654657374';
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      trackMap.set(
        CardanoUtils.getBoxId(TestData.cardanoTx1.inputs[0]),
        undefined
      );
      expect(result).toEqual(trackMap);
    });
  });

  describe('getTransactionsBoxMapping', () => {
    const network = new TestCardanoNetwork();
    class TestCardanoChain extends CardanoChain {
      callGetTransactionsBoxMapping = (
        serializedTransactions: Transaction[],
        address: string,
        tokenId?: string
      ) => {
        return this.getTransactionsBoxMapping(
          serializedTransactions,
          address,
          tokenId
        );
      };
    }
    const testInstance = new TestCardanoChain(
      network,
      configs,
      tokenMap,
      feeRationDivisor,
      null as any
    );

    /**
     * @target CardanoChain.getTransactionsBoxMapping should construct mapping
     * successfully when no token provided
     * @dependencies
     * @scenario
     * - mock serialized transactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map equal to constructed map
     */
    it('should construct mapping successfully when no token provided', () => {
      // mock serialized transactions
      const transactions = [TestData.transaction1].map((txJson) =>
        Transaction.from_json(txJson)
      );

      // call the function
      const result = testInstance.callGetTransactionsBoxMapping(
        transactions,
        configs.addresses.lock
      );

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      const boxMapping = TestData.transaction1BoxMapping;
      boxMapping.forEach((mapping) => {
        const candidate = JsonBI.parse(
          mapping.serializedOutput
        ) as CardanoBoxCandidate;
        trackMap.set(mapping.inputId, {
          txId: TestData.transaction1Id,
          index: 1,
          value: candidate.value,
          assets: candidate.assets,
        });
      });
      expect(result).toEqual(trackMap);
    });

    /**
     * @target CardanoChain.getTransactionsBoxMapping should construct mapping
     * successfully when token provided
     * @dependencies
     * @scenario
     * - mock serialized transactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map equal to constructed map
     */
    it('should construct mapping successfully when token provided', () => {
      // mock serialized transactions
      const transactions = [TestData.transaction1].map((txJson) =>
        Transaction.from_json(txJson)
      );

      // call the function
      const trackingTokenId =
        'ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286.5273744552477654657374';
      const result = testInstance.callGetTransactionsBoxMapping(
        transactions,
        configs.addresses.lock,
        trackingTokenId
      );

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      const boxMapping = TestData.transaction1BoxMapping;
      boxMapping.forEach((mapping) => {
        const candidate = JsonBI.parse(
          mapping.serializedOutput
        ) as CardanoBoxCandidate;
        trackMap.set(mapping.inputId, {
          txId: TestData.transaction1Id,
          index: 1,
          value: candidate.value,
          assets: candidate.assets,
        });
      });
      expect(result).toEqual(trackMap);
    });

    /**
     * @target CardanoChain.getTransactionsBoxMapping should map inputs to
     * undefined when no valid output box found
     * @dependencies
     * @scenario
     * - mock serialized transactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return a map of each box to undefined
     */
    it('should map inputs to undefined when no valid output box found', () => {
      // mock serialized transactions
      const transactions = [TestData.transaction1].map((txJson) =>
        Transaction.from_json(txJson)
      );

      // call the function
      const trackingTokenId = 'asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p0';
      const result = testInstance.callGetTransactionsBoxMapping(
        transactions,
        configs.addresses.lock,
        trackingTokenId
      );

      // check returned value
      const trackMap = new Map<string, CardanoUtxo | undefined>();
      const boxMapping = TestData.transaction1BoxMapping;
      boxMapping.forEach((mapping) => {
        trackMap.set(mapping.inputId, undefined);
      });
      expect(result).toEqual(trackMap);
    });
  });

  describe('isTxInMempool', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.isTxInMempool should true when tx is in mempool
     * @dependencies
     * @scenario
     * - mock getMempoolTransactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should true when tx is in mempool', async () => {
      // mock getMempoolTransactions
      const transactions = [TestData.cardanoTx1];
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );

      // call the function
      const txId = transactions[0].id;
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxInMempool(txId);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target CardanoChain.isTxInMempool should false when tx is NOT in mempool
     * @dependencies
     * @scenario
     * - mock getMempoolTransactions
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should false when tx is NOT in mempool', async () => {
      //  mock getMempoolTransactions
      const transactions = [TestData.cardanoTx1];
      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        transactions
      );

      // call the function
      const txId = TestUtils.generateRandomId();
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxInMempool(txId);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('isTxValid', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.isTxValid should return true when
     * all tx inputs are valid and ttl is less than current slot
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction
     * - mock currentSlot of cardano network
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when all tx inputs are valid and ttl is less than current slot', async () => {
      // mock PaymentTransaction
      const payment1 = CardanoTransaction.fromJson(
        TestData.transaction5PaymentTransaction
      );

      // mock a network object to return as valid for all inputs of a mocked transaction
      const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
      const txInputs = Transaction.from_bytes(payment1.txBytes).body().inputs();
      for (let i = 0; i < txInputs.len(); i++) {
        when(isBoxUnspentAndValidSpy)
          .calledWith(CardanoUtils.getBoxId(txInputs.get(i)))
          .mockResolvedValueOnce(true);
      }

      // mock get current slot of cardano network
      const currentSlotSpy = spyOn(network, 'currentSlot');
      currentSlotSpy.mockResolvedValue(100);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxValid(payment1);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target CardanoChain.isTxValid should return false when ttl is expired
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock currentSlot of cardano network
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when ttl is expired', async () => {
      // mock PaymentTransaction
      const payment1 = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // mock get current slot of cardano network
      const currentSlotSpy = spyOn(network, 'currentSlot');
      currentSlotSpy.mockResolvedValue(1000);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxValid(payment1);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.isTxValid should return false when at least one input
     * is invalid
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction except for the first one
     * - mock currentSlot of cardano network
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when at least one input is invalid', async () => {
      // mock PaymentTransaction
      const payment1 = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // mock a network object to return as valid for all inputs of a mocked
      //   transaction except for the first one
      const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
      const txInputs = Transaction.from_bytes(payment1.txBytes).body().inputs();
      for (let i = 0; i < txInputs.len(); i++) {
        when(isBoxUnspentAndValidSpy)
          .calledWith(CardanoUtils.getBoxId(txInputs.get(i)))
          .mockResolvedValueOnce(i !== 0);
      }

      // mock get current slot of cardano network
      const currentSlotSpy = spyOn(network, 'currentSlot');
      currentSlotSpy.mockResolvedValue(100);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxValid(payment1);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.isTxValid should return false when
     * input and output assets do not match
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - mock a network object to return as valid for all inputs of a mocked
     *   transaction
     * - mock currentSlot of cardano network
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when input and output assets do not match', async () => {
      // mock PaymentTransaction
      const payment1 = CardanoTransaction.fromJson(
        TestData.transaction6PaymentTransaction
      );

      // mock a network object to return as valid for all inputs of a mocked transaction
      const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
      const txInputs = Transaction.from_bytes(payment1.txBytes).body().inputs();
      for (let i = 0; i < txInputs.len(); i++) {
        when(isBoxUnspentAndValidSpy)
          .calledWith(CardanoUtils.getBoxId(txInputs.get(i)))
          .mockResolvedValueOnce(true);
      }

      // mock get current slot of cardano network
      const currentSlotSpy = spyOn(network, 'currentSlot');
      currentSlotSpy.mockResolvedValue(100);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.isTxValid(payment1);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('verifyTransactionFee', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.verifyTransactionFee should return true when fee is
     * less than config fee
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when fee is less than config fee', () => {
      // mock PaymentTransaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = cardanoChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target CardanoChain.verifyTransactionFee should return false when fee is
     * more than config fee
     * @dependencies
     * @scenario
     * - mock PaymentTransaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when fee is more than config fee', () => {
      // mock PaymentTransaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction2PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = cardanoChain.verifyTransactionFee(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('getTxConfirmationStatus', () => {
    const txType = TransactionType.payment;
    const requiredConfirmation = paymentTxConfirmation;

    /**
     * @target CardanoChain.getTxConfirmationStatus should return
     * ConfirmedEnough when tx confirmation is more than required number
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return enough confirmation for mocked txId
     * - call the function
     * - check returned value
     * @expected
     * - it should return `ConfirmedEnough` enum
     */
    it('should return ConfirmedEnough when tx confirmation is more than required number', async () => {
      // generate a random txId
      const txId = TestUtils.generateRandomId();

      // mock a network object to return enough confirmation for mocked txId
      const network = new TestCardanoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(requiredConfirmation + 1);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.ConfirmedEnough);
    });

    /**
     * @target CardanoChain.getTxConfirmationStatus should return
     * NotConfirmedEnough when payment tx confirmation is less than required number
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return insufficient confirmation for mocked
     *   txId
     * - call the function
     * - check returned value
     * @expected
     * - it should return `NotConfirmedEnough` enum
     */
    it('should return NotConfirmedEnough when tx confirmation is less than required number', async () => {
      // generate a random txId
      const txId = TestUtils.generateRandomId();

      // mock a network object to return insufficient confirmation for mocked txId
      const network = new TestCardanoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(requiredConfirmation - 1);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotConfirmedEnough);
    });

    /**
     * @target CardanoChain.getTxConfirmationStatus should return
     * NotFound when tx confirmation is -1
     * @dependencies
     * @scenario
     * - generate a random txId
     * - mock a network object to return -1 confirmation for mocked txId
     * - call the function
     * - check returned value
     * @expected
     * - it should return `NotFound` enum
     */
    it('should return NotFound when tx confirmation is -1', async () => {
      // generate a random txId
      const txId = TestUtils.generateRandomId();

      // mock a network object to return -1 confirmation for mocked txId
      const network = new TestCardanoNetwork();
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy).calledWith(txId).mockResolvedValueOnce(-1);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotFound);
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
     * @target CardanoChain.verifyEvent should return true when event is valid
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return event block height
     * - mock network extractor to return event data
     * - call the function
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when event is valid', async () => {
      //  mock an event
      const event = TestData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock getBlockInfo to return event block height
      const getBlockInfoSpy = spyOn(network, 'getBlockInfo');
      when(getBlockInfoSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce({
          height: event.sourceChainHeight,
        } as any);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when event transaction
     * is not in event block
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds'
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when event transaction is not in event block', async () => {
      // mock an event
      const event = TestData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds'
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          TestUtils.generateRandomId(),
        ]);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when a field of event
     * is wrong
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return event block height
     * - mock network extractor to return event data (expect for a key which
     *   should be wrong)
     * - call the function
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
      const event = TestData.validEvent;

      //  mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock getBlockInfo to return event block height
      const getBlockInfoSpy = spyOn(network, 'getBlockInfo');
      when(getBlockInfoSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce({
          height: event.sourceChainHeight,
        } as any);

      // mock network extractor to return event data (expect for a key which
      //   should be wrong)
      const invalidData = event as unknown as RosenData;
      invalidData[key as keyof RosenData] = `fake_${key}`;
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(invalidData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when event
     * sourceChainHeight is wrong
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock getBlockInfo to return -1 as event block height
     * - mock network extractor to return event data (expect for a key which
     *   should be wrong)
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when event sourceChainHeight is wrong', async () => {
      //  mock an event
      const event = TestData.validEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock getBlockInfo to return -1 as event block height
      const getBlockInfoSpy = spyOn(network, 'getBlockInfo');
      when(getBlockInfoSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce({
          height: -1,
        } as any);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when event amount
     * is less than sum of event fees
     * @dependencies
     * @scenario
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when event amount is less than sum of event fees', async () => {
      // mock an event
      const event = TestData.invalidEvent;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, feeConfig);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when event amount
     * is less than sum of event fees while bridgeFee is less than minimum-fee
     * @dependencies
     * @scenario
     * - mock feeConfig
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
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
      const event = TestData.validEventWithHighFee;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, fee);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target CardanoChain.verifyEvent should return false when event amount
     * is less than sum of event fees while bridgeFee is less than expected value
     * @dependencies
     * @scenario
     * - mock feeConfig
     * - mock an event
     * - mock a network object with mocked 'getBlockTransactionIds' and
     *   'getTransaction' functions
     * - mock network extractor to return event data
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
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
      const event = TestData.validEventWithHighFee;

      // mock a network object with mocked 'getBlockTransactionIds' and
      //   'getTransaction' functions
      const network = new TestCardanoNetwork();
      const getBlockTransactionIdsSpy = spyOn(
        network,
        'getBlockTransactionIds'
      );
      when(getBlockTransactionIdsSpy)
        .calledWith(event.sourceBlockId)
        .mockResolvedValueOnce([
          TestUtils.generateRandomId(),
          event.sourceTxId,
          TestUtils.generateRandomId(),
        ]);

      // mock 'getTransaction' (the tx itself doesn't matter)
      const tx = TestData.cardanoTx1;
      const getTransactionSpy = spyOn(network, 'getTransaction');
      when(getTransactionSpy)
        .calledWith(event.sourceTxId, event.sourceBlockId)
        .mockResolvedValueOnce(tx);

      // mock network extractor to return event data
      const extractorSpy = spyOn(network.extractor, 'get');
      extractorSpy.mockReturnValueOnce(event as unknown as RosenData);

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.verifyEvent(event, fee);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('verifyTransactionExtraConditions', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target: CardanoChain.verifyTransactionExtraConditions should return true when all
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
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = cardanoChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target: CardanoChain.verifyTransactionExtraConditions should return false
     * when transaction has metadata
     * @dependencies
     * @scenario
     * - mock a payment transaction
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when transaction has metadata', () => {
      // mock a payment transaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction3PaymentTransaction
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = cardanoChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target: CardanoChain.verifyTransactionExtraConditions should return false
     * when change box address is wrong
     * @dependencies
     * @scenario
     * - mock a payment transaction
     * - create a new CardanoChain object with custom lock address
     * - call the function
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when change box address is wrong', () => {
      // mock a payment transaction
      const paymentTx = CardanoTransaction.fromJson(
        TestData.transaction1PaymentTransaction
      );

      // create a new CardanoChain object with custom lock address
      const newConfigs = structuredClone(configs);
      newConfigs.addresses.lock = 'TEST';
      const cardanoChain = new CardanoChain(
        network,
        newConfigs,
        tokenMap,
        feeRationDivisor,
        mockedSignFn
      );

      // call the function
      const result = cardanoChain.verifyTransactionExtraConditions(paymentTx);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('rawTxToPaymentTransaction', () => {
    const network = new TestCardanoNetwork();

    /**
     * @target CardanoChain.rawTxToPaymentTransaction should construct transaction successfully
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
      const expectedTx = CardanoTransaction.fromJson(
        TestData.transaction5PaymentTransaction
      );
      const rawTxJsonString = Transaction.from_bytes(
        expectedTx.txBytes
      ).to_json();
      expectedTx.eventId = '';
      expectedTx.txType = TransactionType.manual;

      // mock getUtxo
      const getUtxoSpy = spyOn(network, 'getUtxo');
      expectedTx.inputUtxos.forEach((utxo) =>
        getUtxoSpy.mockResolvedValueOnce(JsonBigInt.parse(utxo) as CardanoUtxo)
      );

      // call the function
      const cardanoChain = generateChainObject(network);
      const result = await cardanoChain.rawTxToPaymentTransaction(
        rawTxJsonString
      );

      // check returned value
      expect(result.toJson()).toEqual(expectedTx.toJson());
    });
  });
});
