export const networkTipResult = {
  data: {
    cardano: {
      __typename: 'Cardano',
      tip: { __typename: 'Block', number: 9511863, slotNo: '107701834' },
    },
  },
  loading: false,
  networkStatus: 7,
};
export const blockHeight = 9511863;
export const absoluteSlot = 107701834;

export const txId =
  '16169d73f8ce4904dda065060079eb6044aee33d936f40729850c5e6690edd78';
export const txBlockInfoResult = {
  data: {
    cardano: {
      __typename: 'Cardano',
      tip: { __typename: 'Block', number: 9617297 },
    },
    transactions: [
      {
        __typename: 'Transaction',
        block: { __typename: 'Block', number: 9474116 },
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const txConfirmation = 143181;
export const notFoundTxBlockInfoResult = {
  data: {
    cardano: {
      __typename: 'Cardano',
      tip: { __typename: 'Block', number: 9617297 },
    },
    transactions: [],
  },
  loading: false,
  networkStatus: 7,
};

export const address =
  'addr1qxxa3kfnnh40yqtepa5frt0tkw4a0rys7v33422lzt8glx43sqtd4vkhjzawajej8aujh27p5a54zx62xf3wvuplynqs3fsqet';
export const addressAssetsResult = {
  data: {
    paymentAddresses: [
      {
        __typename: 'PaymentAddress',
        summary: {
          __typename: 'PaymentAddressSummary',
          assetBalances: [
            {
              __typename: 'AssetBalance',
              asset: { __typename: 'Asset', assetName: 'ada', policyId: 'ada' },
              quantity: '199495022',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '546f6b656e2d6c6f656e',
                policyId:
                  'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
              },
              quantity: '99993884665',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '777252534e2d6c6f656e',
                policyId:
                  'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
              },
              quantity: '899971205383',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '77724552472d6c6f656e',
                policyId:
                  'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
              },
              quantity: '80999949666352506',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '727074574e4556310a',
                policyId:
                  'e0c24b2010068e55bc8f860978d52ee8e62d9af06f106f1fa0d0fd0b',
              },
              quantity: '5000003152971',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '7270745745726756310a',
                policyId:
                  '684dd3236fb0b0088bba20710bb8374ec0e933f80a3151cb6051864a',
              },
              quantity: '22000008721917734',
            },
            {
              __typename: 'AssetBalance',
              asset: {
                __typename: 'Asset',
                assetName: '7270744e4356310a',
                policyId:
                  '613284c87bc3b4598a48ccc050ff05db3d64a0a30a5c5e0abf5c03ef',
              },
              quantity: '75357000000',
            },
          ],
        },
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const addressAssets = {
  nativeToken: 199495022n,
  tokens: [
    {
      id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.546f6b656e2d6c6f656e',
      value: 99993884665n,
    },
    {
      id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.777252534e2d6c6f656e',
      value: 899971205383n,
    },
    {
      id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48.77724552472d6c6f656e',
      value: 80999949666352506n,
    },
    {
      id: 'e0c24b2010068e55bc8f860978d52ee8e62d9af06f106f1fa0d0fd0b.727074574e4556310a',
      value: 5000003152971n,
    },
    {
      id: '684dd3236fb0b0088bba20710bb8374ec0e933f80a3151cb6051864a.7270745745726756310a',
      value: 22000008721917734n,
    },
    {
      id: '613284c87bc3b4598a48ccc050ff05db3d64a0a30a5c5e0abf5c03ef.7270744e4356310a',
      value: 75357000000n,
    },
  ],
};
export const emptyAddressAssetsResult = {
  data: {
    paymentAddresses: [
      {
        __typename: 'PaymentAddress',
        summary: { __typename: 'PaymentAddressSummary', assetBalances: [] },
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};

export const blockId =
  'cd1176524a86b32a6aefea990fa4e64ae2b7a306309f524ed44b7029744e0f9c';
export const blockTxIdsResult = {
  data: {
    blocks: [
      {
        __typename: 'Block',
        transactions: [
          {
            __typename: 'Transaction',
            hash: '2b38ff9600041b9a1e875fe8c362af930fa83be1cd8d5e5c55e5e44457f2cb4d',
          },
          {
            __typename: 'Transaction',
            hash: '4107e6b4e14a5e53460afcb2eabb8fe0462a8d11aecad98e2d66d4bd545354db',
          },
          {
            __typename: 'Transaction',
            hash: '5e0ca23836438dbfa3d58bef7d1944bee44085a416ba5f685ac57e44e3e6d9ef',
          },
          {
            __typename: 'Transaction',
            hash: '6ccc3d51f997d78bb38d6be84be5e46d5d75a3b7385c35f18d1955273079ddf1',
          },
          {
            __typename: 'Transaction',
            hash: '44774fdda992dff4c525648f3b46f37845defae9eee9dd97702f400fc3d7937f',
          },
          {
            __typename: 'Transaction',
            hash: 'e642cb4fd633709c8b7fe9d1b9cdc43169f2c0d20c626a50a9ee28328055fc71',
          },
          {
            __typename: 'Transaction',
            hash: '1f93c276117c523f80c958b4ad5cff7544c2b6255b749e66fc26c19127726150',
          },
          {
            __typename: 'Transaction',
            hash: '8634dea8aaa266cb59a4388670c61620ad9bb914f37a4ac2ba7be44ab1052264',
          },
          {
            __typename: 'Transaction',
            hash: 'af048f615828c7be4fa856f7135ba389a40f196269f3bc802b1f800f21f794a2',
          },
          {
            __typename: 'Transaction',
            hash: 'cfb153306340c1ae2c121f8ce431aea3b589d1b4c17ddcf24f17c601cc94d521',
          },
          {
            __typename: 'Transaction',
            hash: '5ed04a8abd3ee3f08eaff7e3cf2324ea4dcb7e5590a3b037ca910d9a0cb880cc',
          },
          {
            __typename: 'Transaction',
            hash: '1b25f9128f5841309df42227387d0dcbe359677f3ea0341c8f1f09525cd22951',
          },
          {
            __typename: 'Transaction',
            hash: '5f318c59c8bd10ba32debed75de5416480217aad7a27e8d3dfc8f890af9cbdc5',
          },
          {
            __typename: 'Transaction',
            hash: '9e90350fb172ddc4a98616086553fc377875bae493ade4294145348aa0c3003d',
          },
          {
            __typename: 'Transaction',
            hash: '3c91d252b986068a16b2f28bc3a0d4fc3d1d89371fb8b746510feb5e991d5dcb',
          },
          {
            __typename: 'Transaction',
            hash: 'aee84eb4db4d0755fa2efb70f157a9865d29111e31fefa636995664c42e4c917',
          },
          {
            __typename: 'Transaction',
            hash: '4f5df7bfeb7abbcadc2ce8f6f7c4c4fd152315c36303fc06ea9b3433a000ef4b',
          },
          {
            __typename: 'Transaction',
            hash: 'ead1b0ab5b49b2515b6dc9ac7fb8dca8a79e712087130958aa5933508c254c5a',
          },
          {
            __typename: 'Transaction',
            hash: '16169d73f8ce4904dda065060079eb6044aee33d936f40729850c5e6690edd78',
          },
          {
            __typename: 'Transaction',
            hash: '3efcb3a5fe9db15a6a86ed1a66c0817e2fd09c1f88d2efbb886fa75489530689',
          },
          {
            __typename: 'Transaction',
            hash: '4b871d46696a538739b11b7876e42d10e5643847989c081f8618cfe9524d1047',
          },
          {
            __typename: 'Transaction',
            hash: '631d9583ef9e95e3e5eaa463a458405e3a0987817ae35e85089a828d2182af7b',
          },
        ],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const blockTxIds = [
  '2b38ff9600041b9a1e875fe8c362af930fa83be1cd8d5e5c55e5e44457f2cb4d',
  '4107e6b4e14a5e53460afcb2eabb8fe0462a8d11aecad98e2d66d4bd545354db',
  '5e0ca23836438dbfa3d58bef7d1944bee44085a416ba5f685ac57e44e3e6d9ef',
  '6ccc3d51f997d78bb38d6be84be5e46d5d75a3b7385c35f18d1955273079ddf1',
  '44774fdda992dff4c525648f3b46f37845defae9eee9dd97702f400fc3d7937f',
  'e642cb4fd633709c8b7fe9d1b9cdc43169f2c0d20c626a50a9ee28328055fc71',
  '1f93c276117c523f80c958b4ad5cff7544c2b6255b749e66fc26c19127726150',
  '8634dea8aaa266cb59a4388670c61620ad9bb914f37a4ac2ba7be44ab1052264',
  'af048f615828c7be4fa856f7135ba389a40f196269f3bc802b1f800f21f794a2',
  'cfb153306340c1ae2c121f8ce431aea3b589d1b4c17ddcf24f17c601cc94d521',
  '5ed04a8abd3ee3f08eaff7e3cf2324ea4dcb7e5590a3b037ca910d9a0cb880cc',
  '1b25f9128f5841309df42227387d0dcbe359677f3ea0341c8f1f09525cd22951',
  '5f318c59c8bd10ba32debed75de5416480217aad7a27e8d3dfc8f890af9cbdc5',
  '9e90350fb172ddc4a98616086553fc377875bae493ade4294145348aa0c3003d',
  '3c91d252b986068a16b2f28bc3a0d4fc3d1d89371fb8b746510feb5e991d5dcb',
  'aee84eb4db4d0755fa2efb70f157a9865d29111e31fefa636995664c42e4c917',
  '4f5df7bfeb7abbcadc2ce8f6f7c4c4fd152315c36303fc06ea9b3433a000ef4b',
  'ead1b0ab5b49b2515b6dc9ac7fb8dca8a79e712087130958aa5933508c254c5a',
  '16169d73f8ce4904dda065060079eb6044aee33d936f40729850c5e6690edd78',
  '3efcb3a5fe9db15a6a86ed1a66c0817e2fd09c1f88d2efbb886fa75489530689',
  '4b871d46696a538739b11b7876e42d10e5643847989c081f8618cfe9524d1047',
  '631d9583ef9e95e3e5eaa463a458405e3a0987817ae35e85089a828d2182af7b',
];

export const blockInfoResult = {
  data: {
    blocks: [
      {
        __typename: 'Block',
        hash: 'cd1176524a86b32a6aefea990fa4e64ae2b7a306309f524ed44b7029744e0f9c',
        number: 9474116,
        previousBlock: {
          __typename: 'Block',
          hash: '3c4dc4bc12fd4a9ea64b25d667cd741b61b0f9a4dde114c2dc544d806ad4b84c',
        },
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const blockInfo = {
  hash: 'cd1176524a86b32a6aefea990fa4e64ae2b7a306309f524ed44b7029744e0f9c',
  parentHash:
    '3c4dc4bc12fd4a9ea64b25d667cd741b61b0f9a4dde114c2dc544d806ad4b84c',
  height: 9474116,
};

export const noMetadataGetTransactionResult = {
  data: {
    transactions: [
      {
        __typename: 'Transaction',
        hash: '5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052',
        inputs: [
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 0,
            sourceTxHash:
              '4f868ccfc7abfc70a154e4fbe6e8c671add4852716fbb56bc713305744360f22',
            value: '608950932',
            tokens: [],
          },
        ],
        outputs: [
          {
            __typename: 'TransactionOutput',
            address:
              'addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u',
            value: '605950932',
            tokens: [],
          },
          {
            __typename: 'TransactionOutput',
            address:
              'addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u',
            value: '2831500',
            tokens: [],
          },
        ],
        fee: '168500',
        metadata: [],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const noMetadataTx = {
  id: '5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052',
  inputs: [
    {
      txId: '4f868ccfc7abfc70a154e4fbe6e8c671add4852716fbb56bc713305744360f22',
      index: 0,
      value: 608950932n,
      assets: [],
    },
  ],
  outputs: [
    {
      address: 'addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u',
      value: 605950932n,
      assets: [],
    },
    {
      address: 'addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u',
      value: 2831500n,
      assets: [],
    },
  ],
  fee: 168500n,
};
export const rosenMetadataGetTransactionResult = {
  data: {
    transactions: [
      {
        __typename: 'Transaction',
        hash: '16169d73f8ce4904dda065060079eb6044aee33d936f40729850c5e6690edd78',
        inputs: [
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 1,
            sourceTxHash:
              'e1227af0cd22abecd5c6439bc5d558bfae7643af7d300f2fe95cff723138dc52',
            value: '183845802',
            tokens: [
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '899983957004',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '80999982553144332',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '546f6b656e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '99994361492',
              },
            ],
          },
        ],
        outputs: [
          {
            __typename: 'TransactionOutput',
            address:
              'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a',
            value: '182481761',
            tokens: [
              {
                __typename: 'Token',
                quantity: '899983957004',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
              {
                __typename: 'Token',
                quantity: '80999979553144332',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
              {
                __typename: 'Token',
                quantity: '99994361492',
                asset: {
                  __typename: 'Asset',
                  assetName: '546f6b656e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
            ],
          },
          {
            __typename: 'TransactionOutput',
            address:
              'addr1v9kmp9flrq8gzh287q4kku8vmad3vkrw0rwqvjas6vyrf9s9at4dn',
            value: '1180940',
            tokens: [
              {
                __typename: 'Token',
                quantity: '3000000000',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
            ],
          },
        ],
        fee: '183101',
        metadata: [
          {
            __typename: 'TransactionMetadata',
            key: '0',
            value: {
              to: 'ergo',
              bridgeFee: '1968503938',
              toAddress: '9edRKGjpzKjcJKEJEBf1fW61daGS3Exr4Kyhxf4jKTrrbbrwB29',
              networkFee: '9842520',
              fromAddress: [
                'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8',
                '',
              ],
            },
          },
        ],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const rosenMetadataTx = {
  id: '16169d73f8ce4904dda065060079eb6044aee33d936f40729850c5e6690edd78',
  inputs: [
    {
      txId: 'e1227af0cd22abecd5c6439bc5d558bfae7643af7d300f2fe95cff723138dc52',
      index: 1,
      value: 183845802n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 899983957004n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 80999982553144332n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '546f6b656e2d6c6f656e',
          quantity: 99994361492n,
        },
      ],
    },
  ],
  outputs: [
    {
      address:
        'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a',
      value: 182481761n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 899983957004n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 80999979553144332n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '546f6b656e2d6c6f656e',
          quantity: 99994361492n,
        },
      ],
    },
    {
      address: 'addr1v9kmp9flrq8gzh287q4kku8vmad3vkrw0rwqvjas6vyrf9s9at4dn',
      value: 1180940n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 3000000000n,
        },
      ],
    },
  ],
  fee: 183101n,
  metadata: {
    '0': {
      to: 'ergo',
      bridgeFee: '1968503938',
      toAddress: '9edRKGjpzKjcJKEJEBf1fW61daGS3Exr4Kyhxf4jKTrrbbrwB29',
      networkFee: '9842520',
      fromAddress: [
        'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8',
        '',
      ],
    },
  },
};
export const stringMetadataGetTransactionResult = {
  data: {
    transactions: [
      {
        __typename: 'Transaction',
        hash: '30969a67ae026c58a404e160f8c672eb1cf8338c2ffaebbb6810889e8040c27e',
        inputs: [
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 1,
            sourceTxHash:
              '22eb00ce3d80cccd93539023239e9f469017ab6206aaea4f9f614777ec90c9ca',
            value: '1370580',
            tokens: [
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '546f6b656e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '99994361492',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '80999979895664016',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '899983957004',
              },
            ],
          },
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 2,
            sourceTxHash:
              '22eb00ce3d80cccd93539023239e9f469017ab6206aaea4f9f614777ec90c9ca',
            value: '178935560',
            tokens: [],
          },
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 1,
            sourceTxHash:
              '8447038f19de5fd222846e6755811de229d637241da5ecc2b9ea19de87e4ba3b',
            value: '4861992',
            tokens: [
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '1919972815',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '5028692',
              },
            ],
          },
          {
            __typename: 'TransactionInput',
            sourceTxIndex: 1,
            sourceTxHash:
              '8b4cf9b49c922b1fd3357913bce47c79bbd341eb1a171fb5cd000a65ef54cada',
            value: '3705136',
            tokens: [
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '546f6b656e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '403906',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '1162046166',
              },
              {
                __typename: 'Token',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
                quantity: '4425285',
              },
            ],
          },
        ],
        outputs: [
          {
            __typename: 'TransactionOutput',
            address:
              'addr1v9kmp9flrq8gzh287q4kku8vmad3vkrw0rwqvjas6vyrf9s9at4dn',
            value: '24435858',
            tokens: [],
          },
          {
            __typename: 'TransactionOutput',
            address:
              'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a',
            value: '164259853',
            tokens: [
              {
                __typename: 'Token',
                quantity: '99994765398',
                asset: {
                  __typename: 'Asset',
                  assetName: '546f6b656e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
              {
                __typename: 'Token',
                quantity: '80999982977682997',
                asset: {
                  __typename: 'Asset',
                  assetName: '77724552472d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
              {
                __typename: 'Token',
                quantity: '899993410981',
                asset: {
                  __typename: 'Asset',
                  assetName: '777252534e2d6c6f656e',
                  policyId:
                    'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
                },
              },
            ],
          },
        ],
        fee: '177557',
        metadata: [
          { __typename: 'TransactionMetadata', key: '0', value: 'myData' },
        ],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const stringMetadataTx = {
  id: '30969a67ae026c58a404e160f8c672eb1cf8338c2ffaebbb6810889e8040c27e',
  inputs: [
    {
      txId: '22eb00ce3d80cccd93539023239e9f469017ab6206aaea4f9f614777ec90c9ca',
      index: 1,
      value: 1370580n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '546f6b656e2d6c6f656e',
          quantity: 99994361492n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 80999979895664016n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 899983957004n,
        },
      ],
    },
    {
      txId: '22eb00ce3d80cccd93539023239e9f469017ab6206aaea4f9f614777ec90c9ca',
      index: 2,
      value: 178935560n,
      assets: [],
    },
    {
      txId: '8447038f19de5fd222846e6755811de229d637241da5ecc2b9ea19de87e4ba3b',
      index: 1,
      value: 4861992n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 1919972815n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 5028692n,
        },
      ],
    },
    {
      txId: '8b4cf9b49c922b1fd3357913bce47c79bbd341eb1a171fb5cd000a65ef54cada',
      index: 1,
      value: 3705136n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '546f6b656e2d6c6f656e',
          quantity: 403906n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 1162046166n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 4425285n,
        },
      ],
    },
  ],
  outputs: [
    {
      address: 'addr1v9kmp9flrq8gzh287q4kku8vmad3vkrw0rwqvjas6vyrf9s9at4dn',
      value: 24435858n,
      assets: [],
    },
    {
      address:
        'addr1q8hmp5zjzvv7s7pmgemz3mvrkd2nu7609hwgsqa0auf6h7h3r6x6jn2zrt8xs3enc53f4aqks7v5g5t254fu2n8sz2wsla293a',
      value: 164259853n,
      assets: [
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '546f6b656e2d6c6f656e',
          quantity: 99994765398n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '77724552472d6c6f656e',
          quantity: 80999982977682997n,
        },
        {
          policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
          asset_name: '777252534e2d6c6f656e',
          quantity: 899993410981n,
        },
      ],
    },
  ],
  fee: 177557n,
  metadata: {
    '0': 'myData',
  },
};

export const addressUtxosResult = {
  data: {
    utxos: [
      {
        __typename: 'TransactionOutput',
        txHash:
          '60fc1ad97a84360e43d2a1ac47c2b3758f3db373fa3cb4944b51b3f3d15cbe8b',
        index: 0,
        value: '9600000',
        tokens: [],
      },
      {
        __typename: 'TransactionOutput',
        txHash:
          'f33fbfd6cbd60b829c26a1598850b62d001c26e96a71b716ad990f4457922d60',
        index: 0,
        value: '3000000',
        tokens: [
          {
            __typename: 'Token',
            quantity: '281065',
            asset: {
              __typename: 'Asset',
              assetName: '546f6b656e2d6c6f656e',
              policyId:
                'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
            },
          },
        ],
      },
      {
        __typename: 'TransactionOutput',
        txHash:
          '733f8e5b70ccdcd23fad23d1fb2df402a3131a8d622fef75923f884328c4a1ca',
        index: 0,
        value: '3000000',
        tokens: [
          {
            __typename: 'Token',
            quantity: '4398403',
            asset: {
              __typename: 'Asset',
              assetName: '777252534e2d6c6f656e',
              policyId:
                'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
            },
          },
        ],
      },
      {
        __typename: 'TransactionOutput',
        txHash:
          'a1eeeb3f2098f1637c7b891a2033484e8570c55cee2551113cd418b07e1a87c9',
        index: 0,
        value: '8724828',
        tokens: [],
      },
      {
        __typename: 'TransactionOutput',
        txHash:
          '35beffbe6897080b36555cd101e8d74b7282f0de28818339e69473e19c65b959',
        index: 0,
        value: '100000000',
        tokens: [],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const addressUtxos = [
  {
    txId: '60fc1ad97a84360e43d2a1ac47c2b3758f3db373fa3cb4944b51b3f3d15cbe8b',
    index: 0,
    value: 9600000n,
    assets: [],
  },
  {
    txId: 'f33fbfd6cbd60b829c26a1598850b62d001c26e96a71b716ad990f4457922d60',
    index: 0,
    value: 3000000n,
    assets: [
      {
        policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
        asset_name: '546f6b656e2d6c6f656e',
        quantity: 281065n,
      },
    ],
  },
  {
    txId: '733f8e5b70ccdcd23fad23d1fb2df402a3131a8d622fef75923f884328c4a1ca',
    index: 0,
    value: 3000000n,
    assets: [
      {
        policy_id: 'fca58ef8ba9ef1961e132b611de2f8abcd2f34831e615a6f80c5bb48',
        asset_name: '777252534e2d6c6f656e',
        quantity: 4398403n,
      },
    ],
  },
  {
    txId: 'a1eeeb3f2098f1637c7b891a2033484e8570c55cee2551113cd418b07e1a87c9',
    index: 0,
    value: 8724828n,
    assets: [],
  },
  {
    txId: '35beffbe6897080b36555cd101e8d74b7282f0de28818339e69473e19c65b959',
    index: 0,
    value: 100000000n,
    assets: [],
  },
];
export const noUtxoAddressUtxosResult = {
  data: { utxos: [] },
  loading: false,
  networkStatus: 7,
};

export const boxId = '';
export const getUtxoResult = {
  data: {
    utxos: [
      {
        __typename: 'TransactionOutput',
        txHash:
          '60fc1ad97a84360e43d2a1ac47c2b3758f3db373fa3cb4944b51b3f3d15cbe8b',
        index: 0,
        value: '9600000',
        tokens: [],
      },
    ],
  },
  loading: false,
  networkStatus: 7,
};
export const utxo = {
  txId: '60fc1ad97a84360e43d2a1ac47c2b3758f3db373fa3cb4944b51b3f3d15cbe8b',
  index: 0,
  value: 9600000n,
  assets: [],
};
export const notFoundUtxoResult = {
  data: { utxos: [] },
  loading: false,
  networkStatus: 7,
};

export const protocolParamsResult = {
  data: {
    cardano: {
      __typename: 'Cardano',
      currentEpoch: {
        __typename: 'Epoch',
        protocolParams: {
          __typename: 'ProtocolParams',
          minFeeA: 44,
          minFeeB: 155381,
          poolDeposit: '500000000',
          keyDeposit: '2000000',
          maxValSize: '5000',
          maxTxSize: 16384,
          coinsPerUtxoByte: '4310',
        },
      },
    },
  },
  loading: false,
  networkStatus: 7,
};
export const requiredProtocolParams = {
  minFeeA: 44,
  minFeeB: 155381,
  poolDeposit: '500000000',
  keyDeposit: '2000000',
  maxValueSize: 5000,
  maxTxSize: 16384,
  coinsPerUtxoSize: '4310',
};
