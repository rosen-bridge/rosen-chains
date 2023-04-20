import { RosenTokens, TokenMap } from '@rosen-bridge/tokens';
import TestCardanoNetwork from './network/TestCardanoNetwork';
import CardanoChain from '../lib/CardanoChain';
import { CardanoConfigs } from '../lib/types';
import {
  testTokenMap,
  transaction1Order,
  transaction1PaymentTransaction,
} from './testData';
import TestUtils from './testUtils';
import CardanoTransaction from '../lib/CardanoTransaction';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

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
      const order = transaction1Order;
      const payment1 = CardanoTransaction.fromJson(
        transaction1PaymentTransaction
      );
      const getSlotSpy = spyOn(network, 'currentSlot');
      getSlotSpy.mockResolvedValue(100);

      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.generateTransaction(
        payment1.eventId,
        payment1.txType,
        order,
        bankBoxes
      );
      const cardanoTx = result as CardanoTransaction;

      // check returned value
      expect(cardanoTx.txType).toEqual(payment1.txType);
      expect(cardanoTx.eventId).toEqual(payment1.eventId);
      expect(cardanoTx.network).toEqual(payment1.network);

      // extracted order of generated transaction should be the same as input order
      const extractedOrder = cardanoChain.extractTransactionOrder(cardanoTx);
      expect(extractedOrder).toEqual(order);

      // transaction fee and ttl should be the same as input configs
      const tx = Transaction.from_bytes(cardanoTx.txBytes);
      expect(tx.body().fee().to_str()).toEqual(configs.fee.toString());
      expect(tx.body().ttl()).toEqual(164);
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

  describe('getBoxInfo', () => {
    const network = new TestCardanoNetwork();

    it('should get box info successfully', async () => {
      const rawBox = bankBoxes[0];
      const cardanoBox = TestUtils.AddressUtxoToTransactionInput(rawBox);
      const serializedBox = cardanoBox.to_hex();

      // run the test
      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.getBoxInfo(serializedBox);
      expect(result.id).toEqual(rawBox.tx_hash + '.' + rawBox.tx_index);
    });
  });

  describe('signTransaction', function () {
    const network = new TestCardanoNetwork();

    it('should return PaymentTransaction of the signed transaction', async () => {
      const signFunction = async (
        tx: Transaction,
        requiredSign: number
      ): Promise<Transaction> => {
        return tx;
      };

      const paymentTx = CardanoTransaction.fromJson(
        transaction1PaymentTransaction
      );

      // run test
      const cardanoChain = new CardanoChain(network, configs, tokenMap);
      const result = await cardanoChain.signTransaction(
        paymentTx,
        0,
        signFunction
      );

      // check returned value
      expect(result.txId).toEqual(paymentTx.txId);
      expect(result.txType).toEqual(paymentTx.txType);
      expect(result.eventId).toEqual(paymentTx.eventId);
      expect(result.network).toEqual(paymentTx.network);
    });

    it('should throw error when signing failed', async () => {
      const signFunction = async (
        tx: Transaction,
        requiredSign: number
      ): Promise<Transaction> => {
        throw Error(`TestError: sign failed`);
      };

      const paymentTx = CardanoTransaction.fromJson(
        transaction1PaymentTransaction
      );

      // run test
      const cardanoChain = new CardanoChain(network, configs, tokenMap);

      await expect(async () => {
        await cardanoChain.signTransaction(paymentTx, 0, signFunction);
      }).rejects.toThrow('TestError: sign failed');
    });
  });
});
