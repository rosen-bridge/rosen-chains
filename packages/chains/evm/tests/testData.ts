import { Transaction } from 'ethers';
import { PaymentOrder } from '@rosen-chains/abstract-chain';

export const lockAddress = '0xedee4752e5a2f595151c94762fb38e5730357785';

export const erc20PaymentOrder: PaymentOrder = [
  {
    address: '0x6a6a84990fe4d261c6c7c701ea2ce64c0c32b1c7',
    assets: {
      nativeToken: 0n,
      tokens: [
        {
          id: '0x4606d11ff65b17d29e8c5e4085f9a868a8e5e4f2',
          value: 10000n,
        },
      ],
    },
  },
];

export const nativePaymentOrder: PaymentOrder = [
  {
    address: '0x6a6a84990fe4d261c6c7c701ea2ce64c0c32b1c7',
    assets: {
      nativeToken: 1000n,
      tokens: [],
    },
  },
];

// export const paymentTransaction = Transaction.from({
//     type: 2,
//     to: '0x4606d11ff65B17d29e8C5E4085f9a868A8E5E4f2',
//     data: '0xa9059cbb0000000000000000000000004f0d2dde80b45e24ad4019a5aabd6c23aff2842b00000000000000000000000000000000000000000000000000000000e319aa30bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
//     nonce: 10,
//     gasLimit: '21000',
//     gasPrice: null,
//     maxPriorityFeePerGas: '500000000',
//     maxFeePerGas: '48978500000',
//     value: '92850988521632054',
//     chainId: '1',
//     accessList: [],
//     signature: {
//       r: '0xe20c2f0110e9030b12a0e4d78f60ca6a5c58f5b1dc867165b4a1749dc587b6a9',
//       s: '0x67ae6158d51696d9d9119a3217eb42f15e3ddcf5a2f3044544f79ff91aaa6b6a',
//       yParity: 1
//     },
//     hash: '0x769c4a3160c5691e753eff65b4e27320047081f29d5cc308baf88673c9de316c'
//   })
