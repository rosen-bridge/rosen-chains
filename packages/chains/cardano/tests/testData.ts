import {
  AssetBalance,
  EventTrigger,
  PaymentOrder,
} from '@rosen-chains/abstract-chain';

export const testTokenMap = `
{
  "idKeys" : {
    "ergo" : "tokenId",
    "cardano" : "fingerprint"
  },
  "tokens" : [
    {
      "ergo" : {
        "tokenId" : "erg",
        "tokenName" : "erg",
        "decimals" : 9,
        "metaData" : {
          "type" : "ERG",
          "residency" : "native"
        }
      },
      "cardano" : {
        "fingerprint" : "asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz",
        "policyId" : "ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286",
        "assetName" : "5273744552477654657374",
        "decimals" : 0,
        "metaData" : {
          "type" : "native",
          "residency" : "wrapped"
        }
      }
    },
    {
      "ergo" : {
        "tokenId" : "4ed6449240d166b0e44c529b5bf06d210796473d3811b9aa0e15329599164c24",
        "tokenName" : "RST-ADA.V-test",
        "decimals" : 6,
        "metaData" : {
          "type" : "EIP-004",
          "residency" : "wrapped"
        }
      },
      "cardano" : {
        "fingerprint" : "lovelace",
        "policyId" : "",
        "assetName" : "414441",
        "decimals" : 6,
        "metaData" : {
          "type" : "ADA",
          "residency" : "native"
        }
      }
    },
    {
      "ergo" : {
        "tokenId" : "c59e86ef9d0280de582d6266add18fca339a77dfb321268e83033fe47101dc4d",
        "tokenName" : "RST-Cardano-Token.V-test",
        "decimals" : 4,
        "metaData" : {
          "type" : "EIP-004",
          "residency" : "wrapped"
        }
      },
      "cardano" : {
        "fingerprint" : "asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7",
        "policyId" : "cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be",
        "assetName" : "43617264616e6f546f6b656e7654657374",
        "decimals" : 0,
        "metaData" : {
          "type" : "native",
          "residency" : "native"
        }
      }
    },
    {
      "ergo" : {
        "tokenId" : "a1143e81c5ab485a807e6f0f76af1dd70cc5359b29e0b1229d0edfe490d33b67",
        "tokenName" : "Ergo-Token.V-test",
        "decimals" : 4,
        "metaData" : {
          "type" : "EIP-004",
          "residency" : "native"
        }
      },
      "cardano" : {
        "fingerprint" : "asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2",
        "policyId" : "48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b",
        "assetName" : "5273744572676f546f6b656e7654657374",
        "decimals" : 0,
        "metaData" : {
          "type" : "native",
          "residency" : "wrapped"
        }
      }
    }
  ]
}
`;

export const transaction1 = `
{
      "body": {
        "inputs": [
          {
            "transaction_id": "3101943d053d487d78578f230518bd7068ad166d1b1b63488ec822cdcff143a8",
            "index": 0
          },
          {
            "transaction_id": "a878d4560455eff78e9e81721743473b40d55898cb3162dd643d4c4821e05803",
            "index": 0
          },
          {
            "transaction_id": "b2e02269dba680b63f4ac4dfa9f5c967bc208af685709ab9cc2228839547ae52",
            "index": 0
          },
          {
            "transaction_id": "bd391046e9cdb40592eae98e2bb65abf75756ae21b4011044b883e7799c68a33",
            "index": 2
          }
        ],
        "outputs": [
          {
            "address": "addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w",
            "amount": {
              "coin": "2000000",
              "multiasset": {
                "ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286": {
                  "5273744552477654657374": "100"
                }
              }
            },
            "plutus_data": null,
            "script_ref": null
          },
          {
            "address": "addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs",
            "amount": {
              "coin": "137010000",
              "multiasset": {
                "48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b": {
                  "5273744572676f546f6b656e7654657374": "5000"
                },
                "cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be": {
                  "43617264616e6f546f6b656e7654657374": "100"
                },
                "ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286": {
                  "5273744552477654657374": "900"
                }
              }
            },
            "plutus_data": null,
            "script_ref": null
          }
        ],
        "fee": "1000000",
        "ttl": "164",
        "certs": null,
        "withdrawals": null,
        "update": null,
        "auxiliary_data_hash": null,
        "validity_start_interval": null,
        "mint": null,
        "script_data_hash": null,
        "collateral": null,
        "required_signers": null,
        "network_id": null,
        "collateral_return": null,
        "total_collateral": null,
        "reference_inputs": null
      },
      "witness_set": {
        "vkeys": null,
        "native_scripts": null,
        "bootstraps": null,
        "plutus_scripts": null,
        "plutus_data": null,
        "redeemers": null
      },
      "is_valid": true,
      "auxiliary_data": null
    }
`;

export const transaction1InputIds = [
  '3101943d053d487d78578f230518bd7068ad166d1b1b63488ec822cdcff143a8.0',
  'a878d4560455eff78e9e81721743473b40d55898cb3162dd643d4c4821e05803.0',
  'b2e02269dba680b63f4ac4dfa9f5c967bc208af685709ab9cc2228839547ae52.0',
  'bd391046e9cdb40592eae98e2bb65abf75756ae21b4011044b883e7799c68a33.2',
];

export const transaction1BoxMapping = [
  {
    inputId:
      '3101943d053d487d78578f230518bd7068ad166d1b1b63488ec822cdcff143a8.0',
    serializedOutput:
      '825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864',
  },
  {
    inputId:
      'a878d4560455eff78e9e81721743473b40d55898cb3162dd643d4c4821e05803.0',
    serializedOutput:
      '825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864',
  },
  {
    inputId:
      'b2e02269dba680b63f4ac4dfa9f5c967bc208af685709ab9cc2228839547ae52.0',
    serializedOutput:
      '825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864',
  },
  {
    inputId:
      'bd391046e9cdb40592eae98e2bb65abf75756ae21b4011044b883e7799c68a33.2',
    serializedOutput:
      '825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864',
  },
];

export const transaction1Order: PaymentOrder = [
  {
    address:
      'addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w',
    assets: {
      nativeToken: 2000000n,
      tokens: [
        {
          id: 'asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz',
          value: 100n,
        },
      ],
    },
  },
];

export const transaction1PaymentTransaction = `
 {
   "network":"cardano",
   "eventId":"2bedc6e54ede7748e5efc7df689a0a89b281ac1d92d09054650d5f27a25d5b8a",
   "txBytes":"84a400848258202d10e4c431dc9d6f35319720ba6fa9d1973fa4e4d9802fd1cae01540d1b1b9e30082582077b76da1660bd58993b9e9c4382cf773b1a0fb6a505d75964a162ff86fccd21e0282582092d99216cefcf40ff63f223061cf111950bed5c21da459ab540f439a92b8e94200825820ecb1361fba075163d41bd38bb532ffd0a6e0c1971d15c28c3f002c9282a420e4000182825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864825839019d6c179773d4e6590e282c37296ecc31cc2a10a45742772dfbc582666aebc9e1e5ac448cf5bfbfa68056d88273cb4cdcf277bfcecd56bc4e821a082a9b50a3581c48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9ba1515273744572676f546f6b656e7654657374191388581ccfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6bea15143617264616e6f546f6b656e76546573741864581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b5273744552477654657374190384021a000f42400318a4a0f5f6",
   "txId":"ca0fa360f803272ba12a06f85f8ad1ebadbc375ab5602e17c206c1f26198535c",
   "txType":"payment"
}
`;

export const transaction1Assets: AssetBalance = {
  nativeToken: 139010000n,
  tokens: [
    {
      id: 'asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz',
      value: 1000n,
    },
    {
      id: 'asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2',
      value: 5000n,
    },
    { id: 'asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7', value: 100n },
  ],
};

export const transaction1InputAssets: AssetBalance = {
  nativeToken: 40000n,
  tokens: [
    {
      id: 'asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz',
      value: 4000n,
    },
  ],
};

export const transaction2PaymentTransaction = `
{
   "network":"cardano",
   "eventId":"2bedc6e54ede7748e5efc7df689a0a89b281ac1d92d09054650d5f27a25d5b8a",
   "txBytes":"84a400848258200ab4f0c9ef99a29f53ead0d351155e729727f694a8d339f3199a056d01e0641600825820579fd876a9f055b9d6d6ffa736fc23e1fc0643c97c833f579d8ab293d01748de008258209cf282b28f4b24d40fdb7faccf07ff85a65a6568dffd35167e4d4276c77b367900825820a86d298dc2273a58e97ae165ec90ebeea7693b3e51c84df38f658e4307c85b26020182825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864825839019d6c179773d4e6590e282c37296ecc31cc2a10a45742772dfbc582666aebc9e1e5ac448cf5bfbfa68056d88273cb4cdcf277bfcecd56bc4e821b112210f4b4f5ced0a3581c48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9ba1515273744572676f546f6b656e7654657374191388581ccfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6bea15143617264616e6f546f6b656e76546573741864581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b5273744552477654657374190384021a001e84800318a4a0f5f6",
   "txId":"d19cb7395cea03b2e248a2b3721351625bee90148f0bc3d776e83f8d8fd331a6",
   "txType":"payment"
}
`;

export const serializedEventBox =
  'c0b19f051008040004000e20bd663e2b457d4277143d42e0dae82149ee0f2989d40ed99f43564ec6f6c9dfff040204000e2065214ca53fbf09c0875d71f67f28a0471a4d6d4f66c38ae47b6a417e645f68fd04c0700e20a357b00556e9e93c68de1a49e2f9d7c4925da5c2766702ec49b1a50e58281713d805d601e4c6a7041ad602b17201d603b4a573007202d604c2b2a5730100d605cb7204d196830301937202b17203afdc0c1d7201017203d901063c0e63d801d6088c720602ed9383010e8c720601e4c67208041a93c27208720495937205730296830201938cb2db6308b2a47303007304000173059299a373068cc7a70196830201aea4d901066393cbc272067307937205e4c6a7060eb4a03c019410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb5260a031a0a2035f401c431c3adcd4675177be89cc05c70a45de782e93dc226c545e38e37b95c200e83836f818a16766ac7490c5eee7abdc9357e6bb955641ff8ac56412bf576d02097a2dabcd974d69a07c3a03e20d05a36d13b986ffca5670302997484dd87e247200ea77346ecd826701113ef3596670f85ec0d4a000d37a06a762ba14623f360f3205cea78cd9e83ad6de5ae2b4a44494507dd74a8c13223621edfc553b902d5bf7e20307f6f54ca9bd07e1d979beb6d2a35a19ef03339cad45d3f7a3f9aba327799ea20549f37b65bf1c38e24132eeebe9053e8c1e8798a622cd0b3eccda1944ce9aad1207dc9b5fd90c4343d48baddc8a7df8b005dd25a2765dadcabd6bfdcc337bcc29220ba094ca44078a94c780eb7df8e0e8ddcefda1d819bc026250c327b5f044fc10020e8d2e63d683f57b1dc19bd554a316954703b74b1ebf7459f8b9cb8316dc6e6ba1a0c4066303131633037303362306631633866306435663263366539303737386634623037333361373230353463363566616134363162356435313635643865346637046572676f0763617264616e6f333968627672793256386d33386a356767425052587a313858783941746f48364a36796871536d713162625a5a526969447977756761646472317179663575373961716d6b6875326c633230636d6771386d643430367170346e7467366679757878763930377666667a78783332346c39726d6b356b3635657877396a70706b646433747973776436736d66346a753772333861777338366c686779080000000003938700080000000002faf080080000000000013880036572672c6173736574316a7935713561307670737475747135713664386367646d72643471753579656663646e6a677a40366165663661366337343363333131316534666337626436616634373433633361316662663834313432366566633038323064363863623031386638343164350800000000000f10150e20fdd14a1fc1c52cdddd322f6cd2e9c6afa050691f0e48784570edd24d4dd2ca200a3b5e75c6935e7c1969d2e436473e3251bde4c27dde6ccfd9e6982bc12f282c00';

export const validEvent: EventTrigger = {
  height: 300,
  fromChain: 'cardano',
  toChain: 'ergo',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825bc',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ed',
  WIDs: [
    '6d9cfa68dbadb03b8c254db3b5b34da274d3ed039120143dbcf99cce0eaccc6c',
    '9ec0d80a7c624bf5c0c5ef620f4b3d71e2b46a624a77d7a5571fab913b6d7b9c',
  ],
};

export const invalidEvent: EventTrigger = {
  height: 300,
  fromChain: 'cardano',
  toChain: 'ergo',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '5500',
  bridgeFee: '1000',
  networkFee: '5000',
  sourceChainTokenId: 'sourceTokenId',
  targetChainTokenId: 'targetTokenId',
  sourceTxId:
    '6e3dbf41a8e3dbf41a8cd0fe059a54cef8bb140322503d0555a9851f056825bc',
  sourceChainHeight: 1000,
  sourceBlockId:
    '01a33c00accaa91ebe0c946bffe1ec294280a3a51a90f7f4b011f3f37c29c5ed',
  WIDs: [
    '6d9cfa68dbadb03b8c254db3b5b34da274d3ed039120143dbcf99cce0eaccc6c',
    '9ec0d80a7c624bf5c0c5ef620f4b3d71e2b46a624a77d7a5571fab913b6d7b9c',
  ],
};
