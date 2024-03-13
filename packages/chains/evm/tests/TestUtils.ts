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
  chainId: 1,
  chainName: 'ethereum',
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
};
export const mockedSignFn = () => Promise.resolve('');

export class MockGenerator {
  static mockHasLockAddressEnoughAssets = (chain: EvmChain, value: boolean) => {
    spyOn(chain, 'hasLockAddressEnoughAssets').mockResolvedValue(value);
  };
  static mockGetMaxFeePerGas = (network: AbstractEvmNetwork, value: bigint) => {
    spyOn(network, 'getMaxFeePerGas').mockResolvedValue(value);
  };

  static mockGetGasRequiredERC20Transfer = (
    network: AbstractEvmNetwork,
    value: bigint
  ) => {
    spyOn(network, 'getGasRequiredERC20Transfer').mockReturnValue(value);
  };

  static mockGetGasRequiredNativeTransfer = (
    network: AbstractEvmNetwork,
    value: bigint
  ) => {
    spyOn(network, 'getGasRequiredNativeTransfer').mockReturnValue(value);
  };

  static mockGetAddressNextNonce = (
    network: AbstractEvmNetwork,
    value: number
  ) => {
    spyOn(network, 'getAddressNextNonce').mockResolvedValue(value);
  };

  static mockGetMaxPriorityFeePerGas = (
    network: AbstractEvmNetwork,
    value: bigint
  ) => {
    spyOn(network, 'getMaxPriorityFeePerGas').mockResolvedValue(value);
  };
}
