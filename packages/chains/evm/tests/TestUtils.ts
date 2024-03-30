import * as testData from './testData';
import { EvmConfigs } from '../lib/types';
import EvmChain from '../lib/EvmChain';
import { vi } from 'vitest';
import { AbstractEvmNetwork } from '../lib';

const spyOn = vi.spyOn;
const observationTxConfirmation = 5;
const paymentTxConfirmation = 9;
const coldTxConfirmation = 10;
const manualTxConfirmation = 11;
const rwtId =
  '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
export const configs: EvmConfigs = {
  maxParallelTx: 10,
  fee: 1000000n,
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
  gasPriceSlippage: 15n,
  gasLimitSlippage: 25n,
  gasLimitMultiplier: 3n,
};

export const mockedSignFn = () => Promise.resolve('');

export const mockHasLockAddressEnoughAssets = (
  chain: EvmChain,
  value: boolean
) => {
  spyOn(chain, 'hasLockAddressEnoughAssets').mockResolvedValue(value);
};

export const mockGetMaxFeePerGas = (
  network: AbstractEvmNetwork,
  value: bigint
) => {
  spyOn(network, 'getMaxFeePerGas').mockResolvedValue(value);
};

export const mockGetGasRequired = (
  network: AbstractEvmNetwork,
  value: bigint
) => {
  spyOn(network, 'getGasRequired').mockReturnValue(value);
};

export const mockGetAddressNextAvailableNonce = (
  network: AbstractEvmNetwork,
  value: number
) => {
  spyOn(network, 'getAddressNextAvailableNonce').mockResolvedValue(value);
};

export const mockGetMaxPriorityFeePerGas = (
  network: AbstractEvmNetwork,
  value: bigint
) => {
  spyOn(network, 'getMaxPriorityFeePerGas').mockResolvedValue(value);
};
