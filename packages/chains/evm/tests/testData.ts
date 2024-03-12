import {
  PaymentTransaction,
  TransactionType,
} from '@rosen-chains/abstract-chain';

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
