import { PaymentOrder } from '@rosen-chains/abstract-chain';

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
