export const testAddress =
  '9iMjQx8PzwBKXRvsFUJFJAPoy31znfEeBUGz8DRkcnJX4rJYjVd';

export const testBlockId =
  'fb8ed75a68538c78e6a1e99bf2a13430c58c25bba9ed688381315822372a83a9';

export const testHeight = 900_000n;

export const testTransaction = {
  id: '7b0c2701042c97b9686bcaf89a0b98aa68b1700113aac014d61c20a87464bbeb',
  blockId: '8a550e86a83fc23447ad32a5b5e7528f835d61c0fcb352e29ee8b256db9add2d',
  inclusionHeight: 994948n,
  timestamp: 1683022023452n,
  index: 1n,
  globalIndex: 5133696n,
  numConfirmations: 4n,
  inputs: [
    {
      boxId: '389f1b1774840f03b02754fad07d596da9c9407bb92b93e0c2f5ea213a6bfb5b',
      value: 5339100000n,
      index: 0n,
      spendingProof:
        'd08d61ba93ffc85e0c494bf76689c683705e8862184b81ccf985c7accbad1b03b6e6961f33caa9c209bd524eda863b82fc4e50c943d27afc',
      outputBlockId:
        '7dde8a0d9a6a69e475b89d884376552a00d03631b956d09e15d141699adc2639',
      outputTransactionId:
        '44023049cd304c587fbdaec968051520e4dca8af2b19ff47cc9dedb2a96b508b',
      outputIndex: 7n,
      outputGlobalIndex: 28769806n,
      outputCreatedAt: 994933n,
      outputSettledAt: 994935n,
      ergoTree:
        '0008cd02b9d478c1900bc041580afdfa4508f0f712da8b9cd3a4dd2d4ee781145ba2e1d3',
      address: '9fvuHu172PmRVg1yFdkhYvax1FB8RYidkSQHBEv5rx84Mhn9Ftu',
      assets: [],
      additionalRegisters: {},
    },
  ],
  dataInputs: [],
  outputs: [
    {
      boxId: 'f8e5176c67506bf1fa92a82f6dd5e40ec141d17e74397e76313109da81688440',
      transactionId:
        '7b0c2701042c97b9686bcaf89a0b98aa68b1700113aac014d61c20a87464bbeb',
      blockId:
        '8a550e86a83fc23447ad32a5b5e7528f835d61c0fcb352e29ee8b256db9add2d',
      value: 5329100000n,
      index: 0n,
      globalIndex: 28770253n,
      creationHeight: 994946n,
      settlementHeight: 994948n,
      ergoTree:
        '0008cd027304abbaebe8bb3a9e963dfa9fa4964d7d001e6a1bd225eadc84048ae49b627c',
      address: '9fPiW45mZwoTxSwTLLXaZcdekqi72emebENmScyTGsjryzrntUe',
      assets: [],
      additionalRegisters: {},
      spentTransactionId: null,
      mainChain: true,
    },
    {
      boxId: 'e4093bbe56cd8ca20cc63fdc721ac6149423cdbdd85de9ba0b32950a9b3323b8',
      transactionId:
        '7b0c2701042c97b9686bcaf89a0b98aa68b1700113aac014d61c20a87464bbeb',
      blockId:
        '8a550e86a83fc23447ad32a5b5e7528f835d61c0fcb352e29ee8b256db9add2d',
      value: 10000000n,
      index: 1n,
      globalIndex: 28770254n,
      creationHeight: 994946n,
      settlementHeight: 994948n,
      ergoTree:
        '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304',
      address:
        '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe',
      assets: [],
      additionalRegisters: {},
      spentTransactionId:
        '59cde651b2ff8a84d0ef4e461251870755c7ad63ca64a87ddf9864dfc2d82973',
      mainChain: true,
    },
  ],
  size: 254n,
};
/**
 * Bytes for previous transaction
 */
export const testTransactionBytes =
  '01389f1b1774840f03b02754fad07d596da9c9407bb92b93e0c2f5ea213a6bfb5b38d08d61ba93ffc85e0c494bf76689c683705e8862184b81ccf985c7accbad1b03b6e6961f33caa9c209bd524eda863b82fc4e50c943d27afc00000002e0b98eed130008cd027304abbaebe8bb3a9e963dfa9fa4964d7d001e6a1bd225eadc84048ae49b627c82dd3c000080ade2041005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a5730482dd3c0000';

export const testAddressBalance = {
  nanoErgs: 10_000_000_000n,
  tokens: [
    {
      tokenId:
        'b51021bda2dac73022b749061e0e0dea6ba5be5b231abb3861330e6502667840',
      amount: 10n,
    },
  ],
};
export const testAddressBalanceWithInvalidTokens = {
  nanoErgs: 10_000_000_000n,
  tokens: [
    {
      tokenId:
        '3d21be3e841fbd6096414375c53d4a010773249ffca823790f56706820215ea1',
    },
    {
      amount: 5n,
    },
    {
      tokenId:
        'b51021bda2dac73022b749061e0e0dea6ba5be5b231abb3861330e6502667840',
      amount: 10n,
    },
  ],
};

export const testPartialTransactions = [
  {
    id: '4ff4f9c43f93eeb6630d742ff76535b969354400462f8c5225934ae70ec5f37e',
  },
  {
    id: '04026bd6af4618b7127519b45f4f766fc0a95b7d3eaea1f10bc64cb7e148b02d',
  },
];
export const testPartialTransactionsWithAbsentIds = [
  {},
  {
    id: '04026bd6af4618b7127519b45f4f766fc0a95b7d3eaea1f10bc64cb7e148b02d',
  },
];

export const testBlockHeaders = {
  parentId: '',
  height: 10n,
};

export const testMempoolTransactions = Array(100).fill(testTransaction);
