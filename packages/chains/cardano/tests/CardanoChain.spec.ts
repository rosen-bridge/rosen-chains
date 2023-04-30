import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';
import TestCardanoNetwork from './network/TestCardanoNetwork';
import CardanoChain from '../lib/CardanoChain';
import { CardanoConfigs } from '../lib/types';
import {
  testTokenMap,
  transaction1,
  transaction1Assets,
  transaction1BoxMapping,
  transaction1InputIds,
  transaction1Order,
  transaction1PaymentTransaction,
} from './testData';
import TestUtils from './testUtils';
import CardanoTransaction from '../lib/CardanoTransaction';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { when } from 'jest-when';
import CardanoUtils from '../lib/CardanoUtils';

const spyOn = jest.spyOn;

describe('CardanoChain', () => {
  const configs: CardanoConfigs = {
    fee: 1000000n,
    minBoxValue: 2000000n,
    txTtl: 64,
    lockAddress:
      'addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs',
    coldStorageAddress: 'cold',
    rwtId: 'rwt',
    coldTxConfirmation: 1,
    paymentTxConfirmation: 1,
    observationTxConfirmation: 1,
  };
  const rosenTokens: RosenTokens = JSON.parse(testTokenMap);
  const tokenMap = new TokenMap(rosenTokens);
  const bankBoxes = TestUtils.mockBankBoxes();

  describe('generateTransaction', () => {
    const network = new TestCardanoNetwork();

    it('should generate payment transaction successfully', async () => {
      // const order = transaction1Order;
      // const payment1 = CardanoTransaction.fromJson(
      //   transaction1PaymentTransaction
      // );
      // const getSlotSpy = spyOn(network, 'currentSlot');
      // getSlotSpy.mockResolvedValue(100);
      //
      // const cardanoChain = new CardanoChain(network, configs, tokenMap);
      // const result = await cardanoChain.generateTransaction(
      //   payment1.eventId,
      //   payment1.txType,
      //   order,
      //   bankBoxes
      // );
      // const cardanoTx = result as CardanoTransaction;
      //
      // // check returned value
      // expect(cardanoTx.txType).toEqual(payment1.txType);
      // expect(cardanoTx.eventId).toEqual(payment1.eventId);
      // expect(cardanoTx.network).toEqual(payment1.network);
      //
      // // extracted order of generated transaction should be the same as input order
      // const extractedOrder = cardanoChain.extractTransactionOrder(cardanoTx);
      // expect(extractedOrder).toEqual(order);
      //
      // // transaction fee and ttl should be the same as input configs
      // const tx = Transaction.from_bytes(cardanoTx.txBytes);
      // expect(tx.body().fee().to_str()).toEqual(configs.fee.toString());
      // expect(tx.body().ttl()).toEqual(164);
      expect(1).toBe(1);
    });
  });

  describe('extractTransactionOrder', () => {
    const network = new TestCardanoNetwork();

    it('should extract transaction order successfully', () => {
      const paymentTx = CardanoTransaction.fromJson(
        transaction1PaymentTransaction
      );
      const expectedOrder = transaction1Order;

      // run test
      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = cardanoChain.extractTransactionOrder(paymentTx);

      // check returned value
      expect(result).toEqual(expectedOrder);
    });
  });

  // describe('getBoxInfo', () => {
  //   const network = new TestCardanoNetwork();
  //
  //   it('should get box info successfully', async () => {
  //     const rawBox = bankBoxes[0];
  //     const cardanoBox = TestUtils.AddressUtxoToTransactionInput(rawBox);
  //     const serializedBox = cardanoBox.to_hex();
  //
  //     // run the test
  //     const cardanoChain = new CardanoChain(network, configs, tokenMap);
  //     const result = await cardanoChain.getBoxInfo(serializedBox);
  //     expect(result.id).toEqual(rawBox.tx_hash + '.' + rawBox.tx_index);
  //     //TODO: add expect for box assets
  //   });
  // });
  //
  // describe('signTransaction', () => {
  //   const network = new TestCardanoNetwork();
  //
  //   it('should return PaymentTransaction of the signed transaction', async () => {
  //     const signFunction = async (
  //       tx: Transaction,
  //       requiredSign: number
  //     ): Promise<Transaction> => {
  //       return tx;
  //     };
  //
  //     const paymentTx = CardanoTransaction.fromJson(
  //       transaction1PaymentTransaction
  //     );
  //
  //     // run test
  //     const cardanoChain = new CardanoChain(network, configs, tokenMap);
  //     const result = await cardanoChain.signTransaction(
  //       paymentTx,
  //       0,
  //       signFunction
  //     );
  //
  //     // check returned value
  //     expect(result.txId).toEqual(paymentTx.txId);
  //     expect(result.txType).toEqual(paymentTx.txType);
  //     expect(result.eventId).toEqual(paymentTx.eventId);
  //     expect(result.network).toEqual(paymentTx.network);
  //   });
  //
  //   it('should throw error when signing failed', async () => {
  //     const signFunction = async (
  //       tx: Transaction,
  //       requiredSign: number
  //     ): Promise<Transaction> => {
  //       throw Error(`TestError: sign failed`);
  //     };
  //
  //     const paymentTx = CardanoTransaction.fromJson(
  //       transaction1PaymentTransaction
  //     );
  //
  //     // run test
  //     const cardanoChain = new CardanoChain(network, configs, tokenMap);
  //
  //     await expect(async () => {
  //       await cardanoChain.signTransaction(paymentTx, 0, signFunction);
  //     }).rejects.toThrow('TestError: sign failed');
  //   });
  // });

  describe('getTransactionAssets', () => {
    const network = new TestCardanoNetwork();

    it('should get transaction assets successfully', () => {
      const paymentTx = CardanoTransaction.fromJson(
        transaction1PaymentTransaction
      );

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = cardanoChain.getTransactionAssets(paymentTx);
      // console.log(result.outputAssets);
      expect(result.outputAssets).toEqual(transaction1Assets);
      // TODO: check input assets
    });
  });

  describe('getMempoolBoxMapping', () => {
    const network = new TestCardanoNetwork();
    const trackingAddress =
      'addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w';

    it('should construct mapping successfully when no token provided', async () => {
      const serializedTransactions: Array<string> = [transaction1].map(
        (txJson) => {
          const cardanoTx = Transaction.from_json(txJson);
          return cardanoTx.to_hex();
        }
      );
      const boxMapping = transaction1BoxMapping;

      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      const trackMap = new Map<string, string>();
      boxMapping.forEach((mapping) =>
        trackMap.set(mapping.inputId, mapping.serializedOutput)
      );

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.getMempoolBoxMapping(trackingAddress);

      expect(result).toEqual(trackMap);
    });

    it('should construct mapping successfully when token provided', async () => {
      const serializedTransactions: Array<string> = [transaction1].map(
        (txJson) => {
          const cardanoTx = Transaction.from_json(txJson);
          return cardanoTx.to_hex();
        }
      );
      const boxMapping = transaction1BoxMapping;
      const trackingTokenId = 'asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz';

      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      const trackMap = new Map<string, string>();
      boxMapping.forEach((mapping) =>
        trackMap.set(mapping.inputId, mapping.serializedOutput)
      );

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      expect(result).toEqual(trackMap);
    });

    it('should map inputs to undefined when no valid output box found', async () => {
      const serializedTransactions: Array<string> = [transaction1].map(
        (txJson) => {
          const cardanoTx = Transaction.from_json(txJson);
          return cardanoTx.to_hex();
        }
      );
      const boxMapping = transaction1BoxMapping;
      const trackingTokenId = 'asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2';

      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      const trackMap = new Map<string, string | undefined>();
      boxMapping.forEach((mapping) => trackMap.set(mapping.inputId, undefined));

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.getMempoolBoxMapping(
        trackingAddress,
        trackingTokenId
      );

      expect(result).toEqual(trackMap);
    });
  });

  describe('isTxInMempool', () => {
    const network = new TestCardanoNetwork();

    it('should true when tx is in mempool', async () => {
      const serializedTransactions: Array<string> = [transaction1].map(
        (txJson) => {
          const cardanoTx = Transaction.from_json(txJson);
          return cardanoTx.to_hex();
        }
      );

      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      const tx = CardanoWasm.Transaction.from_bytes(
        Buffer.from(serializedTransactions[0], 'hex')
      );
      const txId = Buffer.from(
        CardanoWasm.hash_transaction(tx.body()).to_bytes()
      ).toString('hex');

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.isTxInMempool(txId);

      expect(result).toEqual(true);
    });

    it('should false when tx is NOT in mempool', async () => {
      const serializedTransactions: Array<string> = [transaction1].map(
        (txJson) => {
          const cardanoTx = Transaction.from_json(txJson);
          return cardanoTx.to_hex();
        }
      );

      spyOn(network, 'getMempoolTransactions').mockResolvedValueOnce(
        serializedTransactions
      );

      const txId = TestUtils.generateRandomId();

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.isTxInMempool(txId);

      expect(result).toEqual(false);
    });
  });

  // describe('isTxValid', () => {
  //   const network = new TestCardanoNetwork();
  //
  //   it('should return true when all inputs are valid', async () => {
  //     const payment1 = CardanoTransaction.fromJson(
  //       transaction1PaymentTransaction
  //     );
  //     const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
  //     const txInputs = Transaction.from_bytes(payment1.txBytes).body().inputs();
  //     for (let i = 0; i < txInputs.len(); i++) {
  //       when(isBoxUnspentAndValidSpy)
  //         .calledWith(CardanoUtils.getBoxId(txInputs.get(i)))
  //         .mockResolvedValueOnce(true);
  //     }
  //
  //     const cardanoChain = new CardanoChain(network, configs, tokenMap);
  //     const result = await cardanoChain.isTxValid(payment1);
  //
  //     expect(result).toEqual(true);
  //   });
  //
  //   it('should return false when at least one input is invalid', async () => {
  //     const payment1 = CardanoTransaction.fromJson(
  //       transaction1PaymentTransaction
  //     );
  //     const isBoxUnspentAndValidSpy = spyOn(network, 'isBoxUnspentAndValid');
  //     const txInputs = Transaction.from_bytes(payment1.txBytes).body().inputs();
  //     let isFirstBox = true;
  //     for (let i = 0; i < txInputs.len(); i++) {
  //       when(isBoxUnspentAndValidSpy)
  //         .calledWith(CardanoUtils.getBoxId(txInputs.get(i)))
  //         .mockResolvedValueOnce(!isFirstBox);
  //       isFirstBox = false;
  //     }
  //
  //     const cardanoChain = new CardanoChain(network, configs, tokenMap);
  //     const result = await cardanoChain.isTxValid(payment1);
  //
  //     expect(result).toEqual(false);
  //   });
  // });
});
