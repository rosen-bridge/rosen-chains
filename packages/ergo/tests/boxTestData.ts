import { AssetBalance } from '@rosen-chains/abstract-chain';

export const ergoBox1 = `{
  "boxId": "09704ca5e07fe502e4974b07ba8ec7e32c242d1dfc06b036465d6596f5a8ed4b",
  "transactionId": "c6f3f72a20ece32497e66befb22affff8cf6f706ac500bb363bc856548932f6a",
  "blockId": "752a98cb1f8303f31cd8cf8c472edcd03f99e144aa776dda8a25a7d475ed69aa",
  "value": 269997000000,
  "index": 2,
  "globalIndex": 402003,
  "creationHeight": 180766,
  "settlementHeight": 180768,
  "ergoTree": "0008cd02e7c7c9ff46e5a3390e9f5546013de6700484c59086de40a6f62eabaf18c13483",
  "address": "9gH92yjsJCBHwx4fDbXe6j8jLdDBMX3dm6nqwiHhUqyxgNKXmoK",
  "assets": [
    {
      "tokenId": "25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff",
      "index": 0,
      "amount": 100
    },
    {
      "tokenId": "3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580",
      "index": 1,
      "amount": 77
    },
    {
      "tokenId": "7b0cc1b9c6e3dbf41a8cd0fe059a545dfbd0dfafc4093d0555a9851f06662dff",
      "index": 2,
      "amount": 10000000
    }
  ],
  "additionalRegisters": {},
  "spentTransactionId": "a1e6896f0537f1265a0b83c283f3add139beabed9d21c98424408a2b0fce4918",
  "mainChain": true
}`;

export const box1Assets: AssetBalance = {
  nativeToken: 269997000000n,
  tokens: [
    {
      id: '25bcbb2381e2569221737f12e06215c59cef8bb1403225084aaf6cf61f500bff',
      value: 100n,
    },
    {
      id: '3688bf4dbfa9e77606446ca0189546621097cee6979e2befc8ef56825ba82580',
      value: 77n,
    },
    {
      id: '7b0cc1b9c6e3dbf41a8cd0fe059a545dfbd0dfafc4093d0555a9851f06662dff',
      value: 10000000n,
    },
  ],
};
