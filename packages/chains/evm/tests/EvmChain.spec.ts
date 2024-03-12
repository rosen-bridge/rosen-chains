import TestEvmNetwork from './network/TestEvmNetwork';
import { EvmConfigs } from '../lib';
import TestChain from './TestChain';
import * as testData from './testData';

describe('EvmChain', () => {
  const observationTxConfirmation = 5;
  const paymentTxConfirmation = 9;
  const coldTxConfirmation = 10;
  const manualTxConfirmation = 11;
  const rwtId =
    '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
  const feeRatioDivisor = 1n;
  const mockedSignFn = () => Promise.resolve('');

  const generateChainObject = (
    network: TestEvmNetwork,
    rwt = rwtId,
    signFn: (txHash: Uint8Array) => Promise<string> = mockedSignFn
  ) => {
    const config: EvmConfigs = {
      fee: 100n,
      confirmations: {
        observation: observationTxConfirmation,
        payment: paymentTxConfirmation,
        cold: coldTxConfirmation,
        manual: manualTxConfirmation,
      },
      addresses: {
        lock: 'lock_addr',
        cold: 'cold_addr',
        permit: 'permit_addr',
        fraud: 'fraud_addr',
      },
      rwtId: rwt,
      maxParallelTx: 5,
      chainId: 1,
      chainName: 'ethereum',
      abis: {},
    };
    // mock a sign function to return signed transaction
    return new TestChain(network, config, feeRatioDivisor, signFn);
  };

  describe('rawTxToPaymentTransaction', () => {
    const network = new TestEvmNetwork();

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
      const evmChain = generateChainObject(network);
      const result = await evmChain.rawTxToPaymentTransaction(
        testData.transaction0JsonString
      );

      expect(result.toJson()).toEqual(
        testData.transaction0PaymentTransaction.toJson()
      );
    });
  });
});
