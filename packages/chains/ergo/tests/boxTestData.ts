import { AssetBalance, EventTrigger } from '@rosen-chains/abstract-chain';
import { GuardsPkConfig } from '../lib';

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

export const ergoBox2 = `{
  "boxId": "ceea5d56155052be1be4f061b7daaef59c620466e1c9bb6cc5aeb5482fa1a4ed",
  "transactionId": "047ed283de8cc9f470a4050a79a8989a44212a1eaa8dfe95a413ca8a98238190",
  "blockId": "29ea82943b3304c4fdbc020345f31f79842496809e51ca22af9e0c9863fd486b",
  "value": 300000,
  "index": 0,
  "globalIndex": 28468851,
  "creationHeight": 987236,
  "settlementHeight": 987241,
  "ergoTree": "10130400040004040400040204000e204b1e5bcfbd6763b9cea8411841213611258fabed16293af6aa8cd8200b7e12860404040004000400010104020400040004000e20c2eeb21a772554cc9733586df12f27d2f444f50e623c1f57cf89c09dc5097c5505020101d807d601b2a5730000d6028cb2db6308a773010001d603aeb5b4a57302b1a5d901036391b1db630872037303d9010363aedb63087203d901054d0e938c7205017202d604e4c6a7041ad605b2a5730400d606db63087205d607ae7206d901074d0e938c720701720295938cb2db63087201730500017306d196830301ef7203938cb2db6308b2a473070073080001b2720473090095720796830201938cb27206730a0001720293c27205c2a7730bd801d608c2a7d196830501ef720393c27201720893e4c67201041a7204938cb2db6308b2a4730c00730d0001b27204730e00957207d801d609b27206730f0096830701938c720901720293cbc272057310e6c67205051ae6c67205060e93e4c67205070ecb720893e4c67205041a7204938c72090273117312",
  "address": "EE7687i4URb4YuSGSQXPCb7yjKwPzLkrEB4u6kZdScqCkeY81qy66Mz69ohJQhx9whKit1dh7VuPpzSeuadba8PcuitfKL6xnBhHYHXc7Uf6i6tq8NkqfZi1HToyAbVPz4LgnGE9sDbJqgvtord736pvsVmdfmRmTvaEQ8VTDx7RoK71VhEXuwqZF2UjWdY3G3DpmdWPGKprtLg4kjB4ikRpYG9eG9rF33ucgQ1hHmu1UeAUXqhv9e2U7VfF2X6D9js7zc4FXJb1ct4H56eEgwLbKRDAegkHUmeH1TJSknxRqTP1W97E9b9tSRj8P3CEi58J7GzmoWVJUg1ZXmQGAHfFUvDVC6Kif9tNE9rwuvp43QzoFVHcNdNCXxpUhBs7FkKHaW8mBVxzMoXQnpekVVuFePqgNL5CDQ8CjbmwHCSkvbRyXifVr8bCqmxytfEiyGMVzAZjEu3TcoERSJYRt2QwsaJ4wCneFUbm7kvNJ9rDgJS9wzHGLKtbgVbh1STbRwp5Zo6TtvrnQkUkf2sMcnpeZn6LfQSQwdJXdXr",
  "assets": [
    {
      "tokenId": "9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526",
      "index": 0,
      "amount": 1,
      "name": "Ergo-RWT.V-test",
      "decimals": 0,
      "type": "EIP-004"
    },
    {
      "tokenId": "51c1745883a62db6cf47f5765bd695317a01e54bcaaaeaa4aab0b517d2f46a24",
      "index": 1,
      "amount": 75,
      "name": "RSN.V-test",
      "decimals": 0,
      "type": "EIP-004"
    }
  ],
  "additionalRegisters": {
    "R4": {
      "serializedValue": "0e2097a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247",
      "sigmaType": "Coll[SByte]",
      "renderedValue": "97a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247"
    }
  },
  "spentTransactionId": "978793eabc97e6021bad9c68cc793c4f51bb829ddb08bee5f9127a9ed71a2701",
  "mainChain": true
}`;

export const ergoBox3 = `{
  "boxId": "b726e6a3b54a372a96da1e8b5ae2f05bbf8eb143e2235de562cf3a2b54a82b65",
  "transactionId": "70c904dd828dd1f70523dcdffa44ff45c22365d70bf869f370870e650acd5312",
  "blockId": "2ffbea7c4084241c67ca39454643ab44488867d7b46653505a91052aa723bca8",
  "value": 549205010,
  "index": 0,
  "globalIndex": 27724360,
  "creationHeight": 966947,
  "settlementHeight": 966949,
  "ergoTree": "100304000e20a96b8049f0741c7255b60cf01954439d2e4b2d19ae7d8ebc688ecb190a33b5380400d801d601b2db6501fe730000ea02d1aedb63087201d901024d0e938c720201730198b2e4c672010510730200ade4c67201041ad901020ecdee7202",
  "address": "nB3L2PD3LG4ydEj62n9aymRyPCEbkBdzaubgvCWDH2oxHxFBfAUy9GhWDvteDbbUh5qhXxnW8R46qmEiZfkej8gt4kZYvbeobZJADMrWXwFJTsZ17euEcoAp3KDk31Q26okFpgK9SKdi4",
  "assets": [],
  "additionalRegisters": {
    "R4": {
      "serializedValue": "1a050763617264616e6f67616464723171796470643565676472766671396836613071736837356e7373746d766b617a3061646a766d64363837636735796a77676e6866643373636d6a616d32783666336b7075746367743470357168353973336b777761366564786a78733468733768780731303030303030093230303030303030303339677864333139696d5336444b6f66377a4a3164525269424d5973745359367a50484e506f534c364a74694c7a6b3154574d33",
      "sigmaType": "Coll[Coll[SByte]]",
      "renderedValue": "[63617264616e6f,616464723171796470643565676472766671396836613071736837356e7373746d766b617a3061646a766d64363837636735796a77676e6866643373636d6a616d32783666336b7075746367743470357168353973336b777761366564786a7873346873376878,31303030303030,323030303030303030,39677864333139696d5336444b6f66377a4a3164525269424d5973745359367a50484e506f534c364a74694c7a6b3154574d33]"
    }
  },
  "spentTransactionId": null,
  "mainChain": true
}`;

export const eventBox1 = `{
  "boxId": "3875b8e8016e3bb5cfc8f5c9f471e08bd576df650497f407c1c54fb09fb2161f",
  "transactionId": "0a3b5e75c6935e7c1969d2e436473e3251bde4c27dde6ccfd9e6982bc12f282c",
  "blockId": "a10d363d37418aa623e3631deca6677a737a4199c62ced217ad89971d055eb3e",
  "value": 11000000,
  "index": 0,
  "globalIndex": 28467700,
  "creationHeight": 987188,
  "settlementHeight": 987191,
  "ergoTree": "1008040004000e20bd663e2b457d4277143d42e0dae82149ee0f2989d40ed99f43564ec6f6c9dfff040204000e2065214ca53fbf09c0875d71f67f28a0471a4d6d4f66c38ae47b6a417e645f68fd04c0700e20a357b00556e9e93c68de1a49e2f9d7c4925da5c2766702ec49b1a50e58281713d805d601e4c6a7041ad602b17201d603b4a573007202d604c2b2a5730100d605cb7204d196830301937202b17203afdc0c1d7201017203d901063c0e63d801d6088c720602ed9383010e8c720601e4c67208041a93c27208720495937205730296830201938cb2db6308b2a47303007304000173059299a373068cc7a70196830201aea4d901066393cbc272067307937205e4c6a7060e",
  "address": "21oSXpSmAC6qpaSpnMff4uYgpsaCjJ6q8tnvnE3MGp5QjNrtqGSHjip4VcuDGGeuMVg1RH9dxfWhT4LwJZrnwBvTkztYv4wLTXRz8Cwr9ENigonokQBnQiT7d5GDyzuedPdYVKGezdqDWrL56BWRe9NZgP56x5r7kxw9koHjQFAJ9RJADQrUKyKnvyk9jHmK1auNUik23CMK2SxedeWg1HkEYhrdvucvfyJ6hJZqbMbhuh6uYY5XPXLfJuz6kNNnWXb7pv4FtoNZXnRbx4uZcVjYGLV88pETGTyCTpjK8e1VHxBTyY2zPF4efLnYxkvrG8YT31nn5ctrFtKtbDG5etZeomMT1f73aLS7Fu42cxhzvRouxL",
  "assets": [
    {
      "tokenId": "9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526",
      "index": 0,
      "amount": 10,
      "name": "Ergo-RWT.V-test",
      "decimals": 0,
      "type": "EIP-004"
    }
  ],
  "additionalRegisters": {
    "R4": {
      "serializedValue": "1a0a2035f401c431c3adcd4675177be89cc05c70a45de782e93dc226c545e38e37b95c200e83836f818a16766ac7490c5eee7abdc9357e6bb955641ff8ac56412bf576d02097a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247200ea77346ecd826701113ef3596670f85ec0d4a000d37a06a762ba14623f360f3205cea78cd9e83ad6de5ae2b4a44494507dd74a8c13223621edfc553b902d5bf7e20307f6f54ca9bd07e1d979beb6d2a35a19ef03339cad45d3f7a3f9aba327799ea20549f37b65bf1c38e24132eeebe9053e8c1e8798a622cd0b3eccda1944ce9aad1207dc9b5fd90c4343d48baddc8a7df8b005dd25a2765dadcabd6bfdcc337bcc29220ba094ca44078a94c780eb7df8e0e8ddcefda1d819bc026250c327b5f044fc10020e8d2e63d683f57b1dc19bd554a316954703b74b1ebf7459f8b9cb8316dc6e6ba",
      "sigmaType": "Coll[Coll[SByte]]",
      "renderedValue": "[35f401c431c3adcd4675177be89cc05c70a45de782e93dc226c545e38e37b95c,0e83836f818a16766ac7490c5eee7abdc9357e6bb955641ff8ac56412bf576d0,97a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247,0ea77346ecd826701113ef3596670f85ec0d4a000d37a06a762ba14623f360f3,5cea78cd9e83ad6de5ae2b4a44494507dd74a8c13223621edfc553b902d5bf7e,307f6f54ca9bd07e1d979beb6d2a35a19ef03339cad45d3f7a3f9aba327799ea,549f37b65bf1c38e24132eeebe9053e8c1e8798a622cd0b3eccda1944ce9aad1,7dc9b5fd90c4343d48baddc8a7df8b005dd25a2765dadcabd6bfdcc337bcc292,ba094ca44078a94c780eb7df8e0e8ddcefda1d819bc026250c327b5f044fc100,e8d2e63d683f57b1dc19bd554a316954703b74b1ebf7459f8b9cb8316dc6e6ba]"
    },
    "R5": {
      "serializedValue": "1a0c4066303131633037303362306631633866306435663263366539303737386634623037333361373230353463363566616134363162356435313635643865346637046572676f0763617264616e6f333968627672793256386d33386a356767425052587a313858783941746f48364a36796871536d713162625a5a526969447977756761646472317179663575373961716d6b6875326c633230636d6771386d643430367170346e7467366679757878763930377666667a78783332346c39726d6b356b3635657877396a70706b646433747973776436736d66346a753772333861777338366c686779080000000003938700080000000002faf080080000000000013880036572672c6173736574316a7935713561307670737475747135713664386367646d72643471753579656663646e6a677a40366165663661366337343363333131316534666337626436616634373433633361316662663834313432366566633038323064363863623031386638343164350800000000000f1015",
      "sigmaType": "Coll[Coll[SByte]]",
      "renderedValue": "[66303131633037303362306631633866306435663263366539303737386634623037333361373230353463363566616134363162356435313635643865346637,6572676f,63617264616e6f,3968627672793256386d33386a356767425052587a313858783941746f48364a36796871536d713162625a5a52696944797775,61646472317179663575373961716d6b6875326c633230636d6771386d643430367170346e7467366679757878763930377666667a78783332346c39726d6b356b3635657877396a70706b646433747973776436736d66346a753772333861777338366c686779,0000000003938700,0000000002faf080,0000000000013880,657267,6173736574316a7935713561307670737475747135713664386367646d72643471753579656663646e6a677a,36616566366136633734336333313131653466633762643661663437343363336131666266383431343236656663303832306436386362303138663834316435,00000000000f1015]"
    },
    "R6": {
      "serializedValue": "0e20fdd14a1fc1c52cdddd322f6cd2e9c6afa050691f0e48784570edd24d4dd2ca20",
      "sigmaType": "Coll[SByte]",
      "renderedValue": "fdd14a1fc1c52cdddd322f6cd2e9c6afa050691f0e48784570edd24d4dd2ca20"
    }
  },
  "spentTransactionId": "dd2f188a9177181fca5e864eb2f4e69febb91fa9bba409ecd8b075de895086fd",
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

export const guardConfigBox = `{
  "boxId": "6eccf30dc9e6d40e20f8dddc3d66e7ee45c82216906a2bacf14be9da8a811309",
  "value": 1100000,
  "ergoTree": "100504000400040004000402d802d601c2a7d602b2a5730000ea02d196830301937201c2b2a473010093c272027201938cb2db63087202730200018cb2db6308a77303000198b2e4c6a70510730400ade4c6a7041ad901030ecdee7203",
  "assets": [
    {
      "tokenId": "b039e4445337697deaad703fc8d1fcb129c4577e8673394fa2403e54d484eeda",
      "amount": 1
    }
  ],
  "additionalRegisters": {
    "R4": "1a0a2103c236922914cf80be4b642b3ea02f532ceb120a82b7bc5b75a8c2b7dc70810a272102b1d6b33c5ef442fa140d52352cab3e80780e98a44bcf6826604f100dbe2cbec8210217b8b16c47f83c6e96324f4d65434cd77aca1ab969878ba8293b87001c4f216f21024df46a0f95903d15cc8c4f390bb3d0f97dee85273591a88575206baf2d54812e2103aa26adb6a56132f52c0919a351b738beee0d2a240d6b5a82eff27a0f662f34592102d64bd38b103af945c5786dfbd63577779f49e7166e69f622dc5c243dcbbdbab921024f0556828a51b54a2b17bf9d4cc4c7fd9faa3226513193ae0aeaf9075bad4aca2102a8b0cc627e16301030b1a74fc33d49dd364a2b818d5d25e02b4d9e3bfc1f4aac2103380c129ffb41ccc52dd58a128082ac381bb449ef67d230255eea28425599852421023605f5625c0f1099c5966a58a9291d7a546d432faeb99d88a99fa6b745b1fd31",
    "R5": "10020e10"
  },
  "creationHeight": 969636,
  "transactionId": "2d6baff61607166b03da7c68eec2d3ea4611ff88cbf36d964f648f64f8c2cfb8",
  "index": 0
}`;
export const guardNFT =
  'b039e4445337697deaad703fc8d1fcb129c4577e8673394fa2403e54d484eeda';
export const guardPks: GuardsPkConfig = {
  publicKeys: [
    '03c236922914cf80be4b642b3ea02f532ceb120a82b7bc5b75a8c2b7dc70810a27',
    '02b1d6b33c5ef442fa140d52352cab3e80780e98a44bcf6826604f100dbe2cbec8',
    '0217b8b16c47f83c6e96324f4d65434cd77aca1ab969878ba8293b87001c4f216f',
    '024df46a0f95903d15cc8c4f390bb3d0f97dee85273591a88575206baf2d54812e',
    '03aa26adb6a56132f52c0919a351b738beee0d2a240d6b5a82eff27a0f662f3459',
    '02d64bd38b103af945c5786dfbd63577779f49e7166e69f622dc5c243dcbbdbab9',
    '024f0556828a51b54a2b17bf9d4cc4c7fd9faa3226513193ae0aeaf9075bad4aca',
    '02a8b0cc627e16301030b1a74fc33d49dd364a2b818d5d25e02b4d9e3bfc1f4aac',
    '03380c129ffb41ccc52dd58a128082ac381bb449ef67d230255eea284255998524',
    '023605f5625c0f1099c5966a58a9291d7a546d432faeb99d88a99fa6b745b1fd31',
  ],
  requiredSigns: 7,
};

export const validEvent: EventTrigger = {
  height: 200,
  fromChain: 'ergo',
  toChain: 'cardano',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825ba',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ea',
  WIDsHash: '300a544b041a6f48c411c463d4c33c6fb650471d5ebd0332459b8855eeba14cd',
  WIDsCount: 3,
};

export const validEventWithHighFee: EventTrigger = {
  height: 200,
  fromChain: 'ergo',
  toChain: 'cardano',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '900000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825ba',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ea',
  WIDsHash: '300a544b041a6f48c411c463d4c33c6fb650471d5ebd0332459b8855eeba14cd',
  WIDsCount: 3,
};

export const invalidEvent: EventTrigger = {
  height: 200,
  fromChain: 'ergo',
  toChain: 'cardano',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '5500',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825ba',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ea',
  WIDsHash: '300a544b041a6f48c411c463d4c33c6fb650471d5ebd0332459b8855eeba14cd',
  WIDsCount: 3,
};
