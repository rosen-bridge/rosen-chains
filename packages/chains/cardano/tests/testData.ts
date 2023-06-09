import {
  AssetBalance,
  EventTrigger,
  PaymentOrder,
} from '@rosen-chains/abstract-chain';
import { CardanoTx } from '../lib';

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
  '2d10e4c431dc9d6f35319720ba6fa9d1973fa4e4d9802fd1cae01540d1b1b9e3.0',
  '77b76da1660bd58993b9e9c4382cf773b1a0fb6a505d75964a162ff86fccd21e.2',
  '92d99216cefcf40ff63f223061cf111950bed5c21da459ab540f439a92b8e942.0',
  'ecb1361fba075163d41bd38bb532ffd0a6e0c1971d15c28c3f002c9282a420e4.0',
];

export const transaction1BoxMapping = [
  {
    inputId:
      '3101943d053d487d78578f230518bd7068ad166d1b1b63488ec822cdcff143a8.0',
    serializedOutput:
      '{"address":"addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs","value":137010000,"assets":[{"fingerprint":"asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2","asset_name":"515273744572676f546f6b656e7654657374","policy_id":"48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b","quantity":5000},{"fingerprint":"asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7","asset_name":"5143617264616e6f546f6b656e7654657374","policy_id":"cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be","quantity":100},{"fingerprint":"asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz","asset_name":"4b5273744552477654657374","policy_id":"ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286","quantity":900}]}',
  },
  {
    inputId:
      'a878d4560455eff78e9e81721743473b40d55898cb3162dd643d4c4821e05803.0',
    serializedOutput:
      '{"address":"addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs","value":137010000,"assets":[{"fingerprint":"asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2","asset_name":"515273744572676f546f6b656e7654657374","policy_id":"48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b","quantity":5000},{"fingerprint":"asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7","asset_name":"5143617264616e6f546f6b656e7654657374","policy_id":"cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be","quantity":100},{"fingerprint":"asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz","asset_name":"4b5273744552477654657374","policy_id":"ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286","quantity":900}]}',
  },
  {
    inputId:
      'b2e02269dba680b63f4ac4dfa9f5c967bc208af685709ab9cc2228839547ae52.0',
    serializedOutput:
      '{"address":"addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs","value":137010000,"assets":[{"fingerprint":"asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2","asset_name":"515273744572676f546f6b656e7654657374","policy_id":"48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b","quantity":5000},{"fingerprint":"asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7","asset_name":"5143617264616e6f546f6b656e7654657374","policy_id":"cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be","quantity":100},{"fingerprint":"asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz","asset_name":"4b5273744552477654657374","policy_id":"ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286","quantity":900}]}',
  },
  {
    inputId:
      'bd391046e9cdb40592eae98e2bb65abf75756ae21b4011044b883e7799c68a33.2',
    serializedOutput:
      '{"address":"addr1qxwkc9uhw02wvkgw9qkrw2twescuc2ss53t5yaedl0zcyen2a0y7redvgjx0t0al56q9dkyzw095eh8jw7luan2kh38qpw3xgs","value":137010000,"assets":[{"fingerprint":"asset1v25eyenfzrv6me9hw4vczfprdctzy5ed3x99p2","asset_name":"515273744572676f546f6b656e7654657374","policy_id":"48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9b","quantity":5000},{"fingerprint":"asset14d5uaspqyn87ecp8j4yawmguwrgun5086533z7","asset_name":"5143617264616e6f546f6b656e7654657374","policy_id":"cfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6be","quantity":100},{"fingerprint":"asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz","asset_name":"4b5273744552477654657374","policy_id":"ef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286","quantity":900}]}',
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
   "txId":"0066ad9bffa8579a6a7b6f5b6d8fdab20107eca2a2f8435235271173532acab1",
   "txType":"payment"
}
`;

export const transaction1Id =
  '0066ad9bffa8579a6a7b6f5b6d8fdab20107eca2a2f8435235271173532acab1';

export const transaction1Assets: AssetBalance = {
  nativeToken: 140010000n,
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

export const transaction3PaymentTransaction = `
{
   "network":"cardano",
   "eventId":"2bedc6e54ede7748e5efc7df689a0a89b281ac1d92d09054650d5f27a25d5b8a",
   "txBytes":"84a400848258209077052cf56f59eed45e4c9633c623b617a21a7f237c7736523af2a257b80f7c0082582099a6f39f0c50eb07bead2bec6f92536a037c9ccc7b9b1b1321ea496e33b44f0100825820d95bd9e2292a20268793a3303f8115570a87be94f28c85d59efb95266ebfc4b000825820ed4cc46becfe4d57b48c397653044aef739cfab53b7f71edb18f56964cdc4a51020182825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a001e8480a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741864825839019d6c179773d4e6590e282c37296ecc31cc2a10a45742772dfbc582666aebc9e1e5ac448cf5bfbfa68056d88273cb4cdcf277bfcecd56bc4e821b112210f4b5051110a3581c48d4a14b8407af8407702df3afda4cc8a945ce55235e9808c62c5f9ba1515273744572676f546f6b656e7654657374191388581ccfd784ccfe5fe8ce7d09f4ddb65624378cc8022bf3ec240cf41ea6bea15143617264616e6f546f6b656e7654657374182d581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b5273744552477654657374190384021a000f42400318a4a0f5a100a1634f6e656354776f",
   "txId":"4131b9f7f1e77b984029d9d1f5ab7ef54689bc73f936f8d9cae202a8c54e9820",
   "txType":"payment"
}
`;

export const transaction4Order: PaymentOrder = [
  {
    address:
      'addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w',
    assets: {
      nativeToken: 10000000n,
      tokens: [
        {
          id: 'asset1jy5q5a0vpstutq5q6d8cgdmrd4qu5yefcdnjgz',
          value: 1000n,
        },
      ],
    },
  },
];

export const transaction4PaymentTransaction = `
{
   "network":"cardano",
   "eventId":"2bedc6e54ede7748e5efc7df689a0a89b281ac1d92d09054650d5f27a25d5b85",
   "txBytes":"84a400838258202fdc94bb1a1d20233b0e2ac6fbd245ea23ea308a9cc0b118f1502c20608e8cea038258207825206824db48f1fb101426bac21a0cd277719d7c37229a2e6938539090599a00825820d7ff00bb5cbb9159711f10dfa36dd2f07855296e261e5a291bc98548549767ac020182825839019c60f528076136b6c7caf599bd93f57ae4564f9aa69cdb59d2ba473118765b6a41502a9a6f6e1c5da31143e5572e7e5fb7bc5f498bc1cda5821a00989680a1581cef6aa6200e21634e58ce6796b4b61d1d7d059d2ebe93c2996eeaf286a14b52737445524776546573741903e8825839019d6c179773d4e6590e282c37296ecc31cc2a10a45742772dfbc582666aebc9e1e5ac448cf5bfbfa68056d88273cb4cdcf277bfcecd56bc4e821a00897b50a1581c8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9a2445253545018284452535457181e021a000f42400318a4a0f5f6",
   "txId":"044a030f9a05adc5ba08156c5d7d71fb85e8a8c94928cbadd52cce87f5d57712",
   "txType":"payment"
}
`;

export const transaction4ChangeBoxMultiAssets = `
{
  "8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9": {
    "52535450": "40",
    "52535457": "30"
  }
}
`;

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

export const validEventWithHighFee: EventTrigger = {
  height: 300,
  fromChain: 'cardano',
  toChain: 'ergo',
  fromAddress: 'fromAddress',
  toAddress: 'toAddress',
  amount: '1000000',
  bridgeFee: '1000',
  networkFee: '900000',
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

export const cardanoTx1: CardanoTx = {
  id: 'c5afb967619ee64e0d724a56d27670fee6fe698df1375692d9868cb9792467c8',
  inputs: [
    {
      txId: 'faf9346ebeaf65c2720464eb9126e43dfd7b40742e337370b67b84ae0f03dc2b',
      index: 0,
      value: 3000000n,
      assets: [
        {
          policy_id: 'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235',
          asset_name: '484f534b59',
          quantity: 184272501n,
          fingerprint: 'asset17q7r59zlc3dgw0venc80pdv566q6yguw03f0d9',
        },
      ],
    },
  ],
  outputs: [
    {
      address:
        'addr1qxwxpafgqasnddk8et6en0vn74awg4j0n2nfek6e62aywvgcwedk5s2s92dx7msutk33zsl92uh8uhahh305nz7pekjsz5l37w',
      value: 1386445n,
      assets: [
        {
          policy_id: 'a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235',
          asset_name: '484f534b59',
          quantity: 184272501n,
          fingerprint: 'asset17q7r59zlc3dgw0venc80pdv566q6yguw03f0d9',
        },
      ],
    },
    {
      address:
        'addr_test1vze7yqqlg8cjlyhz7jzvsg0f3fhxpuu6m3llxrajfzqecggw704re',
      value: 1344798n,
      assets: [],
    },
  ],
  fee: 268757n,
  metadata: {
    '0': {
      to: 'ergo',
      bridgeFee: '165000000',
      toAddress: '9g7mqqQAnUG4gWi6pFmic65ZfUrrWiVkMnbsg2hXUx6aVbBSTJ4',
      networkFee: '175000',
      fromAddress: [
        'addr1q9jperhqputlfnfqhteu6eu2xhjwxa9keph08vgrqjg357tthg3xm3n4r6p',
        'w85a5p6gdqv9v5zd6vmqdpxvl0jrql2aszjgvaj',
      ],
    },
  },
};
