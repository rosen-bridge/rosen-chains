import {
  PaymentTransaction,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { PaymentOrder, AssetBalance } from '@rosen-chains/abstract-chain';

export const lockAddress = '0xedee4752e5a2f595151c94762fb38e5730357785';

export const nativePaymentOrder: PaymentOrder = [
  {
    address: '0x6a6a84990fe4d261c6c7c701ea2ce64c0c32b1c7',
    assets: {
      nativeToken: 1000n,
      tokens: [],
    },
  },
];

export const testLockAddress = '0x4606d11ff65b17d29e8c5e4085f9a868a8e5e4f2';

export const transaction0PaymentTransaction = new PaymentTransaction(
  'test',
  '0x1c0fd9b5fd25dc41827ec7faf59495ae6b1108eea79f07d59a0da4628bf19989',
  '',
  Buffer.from(
    '02f0010a841dcd6500850b675899a0825208944606d11ff65b17d29e8c5e4085f9a868a8e5e4f2880149df7b6be0313680c0',
    'hex'
  ),
  TransactionType.manual
);
export const transaction0JsonString = `{
  "type": 2,
  "to": "0x4606d11ff65B17d29e8C5E4085f9a868A8E5E4f2",
  "data": "0x",
  "nonce": 10,
  "gasLimit": "21000",
  "gasPrice": null,
  "maxPriorityFeePerGas": "500000000",
  "maxFeePerGas": "48978500000",
  "value": "92850988521632054",
  "chainId": "1",
  "sig": null,
  "accessList": []
}
`;

export const transaction1JsonString = {
  type: 2,
  to: '0xeDee4752e5a2F595151c94762fB38e5730357785',
  data: '0xa9059cbb0000000000000000000000004f0d2dde80b45e24ad4019a5aabd6c23aff2842b00000000000000000000000000000000000000000000000000000000e319aa30bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  nonce: 10,
  gasLimit: '21000',
  gasPrice: null,
  maxPriorityFeePerGas: '500000000',
  maxFeePerGas: '48978500000',
  value: 0,
  chainId: 1,
  sig: null,
  accessList: [],
};

export const erc20transaction = {
  type: 2,
  to: '0xeDee4752e5a2F595151c94762fB38e5730357785',
  data: '0xa9059cbb000000000000000000000000cfb01d43cb1299024171141d449bb9cd08f4c07500000000000000000000000000000000000000000000000000000000c502fc70bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  nonce: 10,
  gasLimit: '55000',
  gasPrice: null,
  maxPriorityFeePerGas: '500000000',
  maxFeePerGas: '48978500000',
  value: 0,
  chainId: '1',
  accessList: [],
  signature: {
    r: '0x7af681001bf23365afc66fbdb18e33bbd69779d3436c3ad2d27797bd133b2235',
    s: '0x79b8f448c88ba863f450ebe916d386d696efe49ed33932c20951ed53fe50f915',
    yParity: 0,
  },
};

export const erc20PaymentOrder: PaymentOrder = [
  {
    address: '0xcfb01d43cb1299024171141d449bb9cd08f4c075',
    assets: {
      nativeToken: 0n,
      tokens: [
        {
          id: '0xedee4752e5a2f595151c94762fb38e5730357785',
          value: 3305307248n,
        },
      ],
    },
  },
];

export const transaction1Assets: AssetBalance = {
  nativeToken: BigInt(21000) * BigInt(48978500000),
  tokens: [
    {
      id: '0xedee4752e5a2f595151c94762fb38e5730357785',
      value: BigInt(3810110000),
    },
  ],
};
