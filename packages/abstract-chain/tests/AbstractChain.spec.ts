import TestChain from './TestChain';
import TestChainNetwork from './network/TestChainNetwork';
import {
  AssetBalance,
  ChainConfigs,
  ConfirmationStatus,
  PaymentTransaction,
  TransactionType,
} from '../lib';
import { when } from 'jest-when';

const spyOn = jest.spyOn;

describe('AbstractChain', () => {
  const paymentTxConfirmation = 6;
  const generateChainObject = (network: TestChainNetwork) => {
    const config: ChainConfigs = {
      fee: 100n,
      confirmations: {
        observation: 5,
        payment: paymentTxConfirmation,
        cold: 7,
        manual: 8,
      },
      addresses: {
        lock: 'lock_addr',
        cold: 'cold_addr',
        permit: 'permit_addr',
        fraud: 'fraud_addr',
      },
      rwtId: 'rwt',
    };
    return new TestChain(network, config);
  };

  describe('verifyNoTokenBurned', () => {
    const paymentTx: PaymentTransaction = {
      network: 'ergo',
      txId: 'mockedTxId',
      eventId: 'mockedNetworkId',
      txBytes: Buffer.from('mockedTxBytes'),
      txType: TransactionType.payment,
      toJson: () => '',
    };
    const network = new TestChainNetwork();

    /**
     * @target AbstractChain.verifyNoTokenBurned should return true when no
     * token burned
     * @dependencies
     * @scenario
     * - mock an AssetBalance
     * - mock chain 'getTransactionAssets' function to return mocked assets
     *   for input and output
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when no token burned', async () => {
      // mock an AssetBalance
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
        ],
      };

      // mock chain 'getTransactionAssets' function to return mocked assets
      const chain = generateChainObject(network);
      const getTransactionAssetsSpy = spyOn(chain, 'getTransactionAssets');
      when(getTransactionAssetsSpy)
        .calledWith(paymentTx)
        .mockResolvedValueOnce({
          inputAssets: a,
          outputAssets: a,
        });

      // run test
      const result = await chain.verifyNoTokenBurned(paymentTx);

      // Check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target AbstractChain.verifyNoTokenBurned should return false when some
     * amount of a token got burned
     * @dependencies
     * @scenario
     * - mock two AssetBalance (second object has less value for a token)
     * - mock chain 'getTransactionAssets' function to return mocked assets
     *   for input and output
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when some amount of a token got burned', async () => {
      // mock two AssetBalance (second object has less value for a token)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
        ],
      };
      const b = structuredClone(a);
      b.tokens[0].value = 5n;

      // mock chain 'getTransactionAssets' function to return mocked assets
      const chain = generateChainObject(network);
      const getTransactionAssetsSpy = spyOn(chain, 'getTransactionAssets');
      when(getTransactionAssetsSpy)
        .calledWith(paymentTx)
        .mockResolvedValueOnce({
          inputAssets: a,
          outputAssets: b,
        });

      // run test
      const result = await chain.verifyNoTokenBurned(paymentTx);

      // Check returned value
      expect(result).toEqual(false);
    });
  });

  describe('getTxConfirmationStatus', () => {
    const txId = 'tx-id';
    const txType = TransactionType.payment;
    const requiredConfirmation = paymentTxConfirmation;
    const network = new TestChainNetwork();

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
     * ConfirmedEnough when tx confirmation is more than required number
     * @dependencies
     * @scenario
     * - mock a network object to return enough confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `ConfirmedEnough` enum
     */
    it('should return ConfirmedEnough when tx confirmation is more than required number', async () => {
      // mock a network object to return enough confirmation for mocked txId
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(requiredConfirmation + 1);

      // run test
      const chain = generateChainObject(network);
      const result = await chain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.ConfirmedEnough);
    });

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
     * NotConfirmedEnough when payment tx confirmation is less than required number
     * @dependencies
     * @scenario
     * - mock a network object to return insufficient confirmation for mocked
     *   txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotConfirmedEnough` enum
     */
    it('should return NotConfirmedEnough when tx confirmation is less than required number', async () => {
      // mock a network object to return insufficient confirmation for mocked
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy)
        .calledWith(txId)
        .mockResolvedValueOnce(requiredConfirmation - 1);

      // run test
      const chain = generateChainObject(network);
      const result = await chain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotConfirmedEnough);
    });

    /**
     * @target ErgoChain.getTxConfirmationStatus should return
     * NotFound when tx confirmation is -1
     * @dependencies
     * @scenario
     * - mock a network object to return -1 confirmation for mocked txId
     * - run test
     * - check returned value
     * @expected
     * - it should return `NotFound` enum
     */
    it('should return NotFound when tx confirmation is -1', async () => {
      // mock a network object to return enough confirmation for mocked txId
      const getTxConfirmationSpy = spyOn(network, 'getTxConfirmation');
      when(getTxConfirmationSpy).calledWith(txId).mockResolvedValueOnce(-1);

      // run test
      const chain = generateChainObject(network);
      const result = await chain.getTxConfirmationStatus(txId, txType);

      // check returned value
      expect(result).toEqual(ConfirmationStatus.NotFound);
    });
  });

  describe('hasLockAddressEnoughAssets', () => {
    const requiredAssets = {
      nativeToken: 100n,
      tokens: [],
    };
    const network = new TestChainNetwork();

    /**
     * @target AbstractChain.hasLockAddressEnoughAssets should return true when
     * assets are enough
     * @dependencies
     * @scenario
     * - mock an AssetBalance with assets more than required assets
     * - mock chain 'getLockAddressAssets' function to return mocked assets
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when assets are enough', async () => {
      // mock an AssetBalance with assets more than required assets
      const lockAssets: AssetBalance = {
        nativeToken: 200n,
        tokens: [],
      };

      // mock chain 'getLockAddressAssets' function to return mocked assets
      const chain = generateChainObject(network);
      const getLockAddressAssetsSpy = spyOn(chain, 'getLockAddressAssets');
      getLockAddressAssetsSpy.mockResolvedValueOnce(lockAssets);

      // run test
      const result = await chain.hasLockAddressEnoughAssets(requiredAssets);

      // Check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target AbstractChain.hasLockAddressEnoughAssets should return false when
     * assets are NOT enough
     * @dependencies
     * @scenario
     * - mock an AssetBalance with assets less than required assets
     * - mock chain 'getLockAddressAssets' function to return mocked assets
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when assets are NOT enough', async () => {
      // mock an AssetBalance with assets less than required assets
      const lockAssets: AssetBalance = {
        nativeToken: 20n,
        tokens: [],
      };

      // mock chain 'getLockAddressAssets' function to return mocked assets
      const chain = generateChainObject(network);
      const getLockAddressAssetsSpy = spyOn(chain, 'getLockAddressAssets');
      getLockAddressAssetsSpy.mockResolvedValueOnce(lockAssets);

      // run test
      const result = await chain.hasLockAddressEnoughAssets(requiredAssets);

      // Check returned value
      expect(result).toEqual(false);
    });
  });
});
