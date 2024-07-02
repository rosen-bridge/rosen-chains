import { vi } from 'vitest';

vi.mock('ethers', async (importOriginal) => {
  const ref = await importOriginal<typeof import('ethers')>();
  const refEthers = ref.ethers;
  return {
    ...ref,
    JsonRpcProvider: vi.fn().mockImplementation((url: string) => {
      return rpcInstance;
    }),
    ethers: {
      ...refEthers,
      Contract: vi.fn().mockImplementation((tokenId, ABI, provider) => {
        return ContractInstance;
      }),
    },
  };
});

export const ContractInstance = {
  balanceOf: vi.fn(),
  name: vi.fn(),
  decimals: vi.fn(),
};

export const rpcInstance = {
  estimateGas: vi.fn(),
  getBalance: vi.fn(),
  getBlock: vi.fn(),
  getBlockNumber: vi.fn(),
  getFeeData: vi.fn(),
  getTransaction: vi.fn(),
  getTransactionCount: vi.fn(),
  _getConnection: () => {
    return {
      timeout: 0,
    };
  },
};
