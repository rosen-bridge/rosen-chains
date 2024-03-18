import { randomBytes } from 'crypto';
import TestChainNetwork from './network/TestChainNetwork';
import { ChainConfigs } from '../lib';
import TestChain from './TestChain';
import * as testData from './testData';

export const generateRandomId = (): string => randomBytes(32).toString('hex');

export const generateChainObject = (network: TestChainNetwork) => {
  const config: ChainConfigs = {
    fee: 100n,
    confirmations: {
      observation: 5,
      payment: testData.paymentTxConfirmation,
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
  return new TestChain(network, config, testData.feeRatioDivisor);
};
