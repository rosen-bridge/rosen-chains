import { CardanoUtxo } from '@rosen-chains/cardano';

export const blockHeight = 8000000n;
export const absoluteSlot = 76592831n;
export const txId =
  'e914fd3ed0735da7731c6e2e23f358d6fc90e5188efc028cd0c49e2d8bb2e77a';
export const address =
  'addr1qxxa3kfnnh40yqtepa5frt0tkw4a0rys7v33422lzt8glx43sqtd4vkhjzawajej8aujh27p5a54zx62xf3wvuplynqs3fsqet';
export const addressBalance = '99000000';
export const addressAssets = [
  {
    address: address,
    decimals: 0n,
    quantity: '15888202094',
    policy_id: '0dad352d8f0d5ce3f5be8b025d6a16141ecceab5a921871792d91f47',
    asset_name: '5273455247',
    fingerprint: 'asset1p40r0eun2alszlxhj7k4uylya4cj54lxkjjmsm',
  },
  {
    address: address,
    decimals: 0n,
    quantity: '1866325',
    policy_id: '8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9',
    asset_name: '52535457',
    fingerprint: 'asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0',
  },
];
export const blockId =
  '9c6e26dcdde688388370410df7cd0bbaa12acf563cd4b76e76dc3d36a9cc533b';
export const parentBlockId =
  '6dc89c6e28360410df837ddebad0b8c2a7c73f561cd4ba66a976dc3d3bce';
export const txHashes = [
  {
    block_hash: blockId,
    tx_hash: '65eebe2262738d1c3a2ac57ce7aa7987613cd8835e7ffe1b44be6cc513464e9a',
  },
  {
    block_hash: blockId,
    tx_hash: 'ffc5558b0041a0531c2e99ced50c066c77afb56c0608716632bde93e92572d95',
  },
  {
    block_hash: blockId,
    tx_hash: '51b640cf0a9b5a241d3fd39174ce414e53b375c1f53904951dd59fa420c29141',
  },
];
export const oldBlockheight = 7000000n;
export const noMetadataTxId =
  '5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052';
export const noMetadataTxBlockId =
  '2e182672a18fa13e6941cd362e28d07854ba3828e63fc8419df908e38972bc44';
export const noMetadataTxKoiosResponse = `{
  "tx_hash": "5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052",
  "block_hash": "2e182672a18fa13e6941cd362e28d07854ba3828e63fc8419df908e38972bc44",
  "block_height": 8780451,
  "epoch_no": 412,
  "epoch_slot": 44869,
  "absolute_slot": 92665669,
  "tx_timestamp": 1684231960,
  "tx_block_index": 7,
  "tx_size": 233,
  "total_output": "608782432",
  "fee": "168500",
  "deposit": "0",
  "invalid_before": null,
  "invalid_after": "92671657",
  "collateral_inputs": [],
  "collateral_output": null,
  "reference_inputs": [],
  "inputs": [
    {
      "value": "608950932",
      "tx_hash": "4f868ccfc7abfc70a154e4fbe6e8c671add4852716fbb56bc713305744360f22",
      "tx_index": 0,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "db261eea741e7abb0550ddde3f9e8b973838e68a77ae394554c30c3a",
        "bech32": "addr1v8djv8h2ws084wc92rwau0u73wtnsw8x3fm6uw292npscwsx2xc98"
      },
      "reference_script": null
    }
  ],
  "outputs": [
    {
      "value": "605950932",
      "tx_hash": "5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052",
      "tx_index": 0,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "6be553ecaf3765b0e5c214b7d4129d4008875fd0b2862cd4cc38a170",
        "bech32": "addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u"
      },
      "reference_script": null
    },
    {
      "value": "2831500",
      "tx_hash": "5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052",
      "tx_index": 1,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "6be553ecaf3765b0e5c214b7d4129d4008875fd0b2862cd4cc38a170",
        "bech32": "addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u"
      },
      "reference_script": null
    }
  ],
  "withdrawals": [],
  "assets_minted": [],
  "metadata": null,
  "certificates": [],
  "native_scripts": [],
  "plutus_contracts": []
}`;
export const expectedNoMetadataTxResponse = `{"id":"5ecf1335f943526c84e5a53201e21344ccbbeda93f9fcae4c642b78214cd1052","inputs":[{"txId":"4f868ccfc7abfc70a154e4fbe6e8c671add4852716fbb56bc713305744360f22","index":0,"value":608950932,"assets":[]}],"outputs":[{"address":"addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u","value":605950932,"assets":[]},{"address":"addr1v94725lv4umktv89cg2t04qjn4qq3p6l6zegvtx5esu2zuqfd487u","value":2831500,"assets":[]}],"fee":168500}`;

export const rosenMetadataTxId =
  '98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3';
export const rosenMetadataTxBlockId =
  '4d321fbd03eca67baa9e581b1355a14d7193f1193494f3be40898ff1110f04e0';
export const rosenMetadataTxKoiosResponse = `{
  "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
  "block_hash": "4d321fbd03eca67baa9e581b1355a14d7193f1193494f3be40898ff1110f04e0",
  "block_height": 8555968,
  "epoch_no": 401,
  "epoch_slot": 181880,
  "absolute_slot": 88050680,
  "tx_timestamp": 1679616971,
  "tx_block_index": 28,
  "tx_size": 660,
  "total_output": "2731375",
  "fee": "268625",
  "deposit": "0",
  "invalid_before": null,
  "invalid_after": null,
  "collateral_inputs": [],
  "collateral_output": null,
  "reference_inputs": [],
  "inputs": [
    {
      "value": "3000000",
      "tx_hash": "ed688bc21f5ed822adadd1f61415821def778201323c8e998baf350e0647ce49",
      "tx_index": 0,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1455",
          "policy_id": "8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9",
          "asset_name": "52535457",
          "fingerprint": "asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"
        }
      ],
      "datum_hash": null,
      "stake_addr": "stake1uxct65zymxmshysrlem60j6ddgkhjecczup79euzj8wauxq0r3gc5",
      "inline_datum": null,
      "payment_addr": {
        "cred": "068186ed813df5f543ee541e1ee1a6dca4cc2ce1e197bc66ee842de2",
        "bech32": "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"
      },
      "reference_script": null
    }
  ],
  "outputs": [
    {
      "value": "1444518",
      "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
      "tx_index": 1,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1455",
          "policy_id": "8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9",
          "asset_name": "52535457",
          "fingerprint": "asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"
        }
      ],
      "datum_hash": null,
      "stake_addr": "stake1uxct65zymxmshysrlem60j6ddgkhjecczup79euzj8wauxq0r3gc5",
      "inline_datum": null,
      "payment_addr": {
        "cred": "068186ed813df5f543ee541e1ee1a6dca4cc2ce1e197bc66ee842de2",
        "bech32": "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"
      },
      "reference_script": null
    },
    {
      "value": "1286857",
      "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
      "tx_index": 0,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "cc1e2d66086462a554a4c0813ccc2e01c06eb36e76dd50a268ab314f",
        "bech32": "addr1v8xputtxppjx9f255nqgz0xv9cquqm4ndemd659zdz4nznc7guuzv"
      },
      "reference_script": null
    }
  ],
  "withdrawals": [],
  "assets_minted": [],
  "metadata": {
    "0": {
      "to": "ergo",
      "bridgeFee": "300000",
      "toAddress": "9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG",
      "networkFee": "500000",
      "fromAddress": [
        "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwf",
        "q8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"
      ]
    }
  },
  "certificates": [],
  "native_scripts": [],
  "plutus_contracts": []
}`;
export const expectedRosenMetadataTxResponse = `{"id":"98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3","inputs":[{"txId":"ed688bc21f5ed822adadd1f61415821def778201323c8e998baf350e0647ce49","index":0,"value":3000000,"assets":[{"policy_id":"8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9","asset_name":"52535457","quantity":1455,"fingerprint":"asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"}]}],"outputs":[{"address":"addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6","value":1444518,"assets":[{"policy_id":"8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9","asset_name":"52535457","quantity":1455,"fingerprint":"asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"}]},{"address":"addr1v8xputtxppjx9f255nqgz0xv9cquqm4ndemd659zdz4nznc7guuzv","value":1286857,"assets":[]}],"fee":268625,"metadata":{"0":{"to":"ergo","bridgeFee":"300000","toAddress":"9hZxV3YNSfbCqS6GEses7DhAVSatvaoNtdsiNvkimPGG2c8fzkG","networkFee":"500000","fromAddress":["addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwf","q8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"]}}}`;

export const differentMetadataTxId =
  'dd8fc82e9ca2d38cffdfb2ab9ec51ea8158f7ade67b95c2dece63de3b8f836a7';
export const differentnoMetadataTxBlockId =
  '87d22e3a156ea1a984bbf7758c29c7efb58cf1b6a4e05e853c3e30d42262ae9c';
export const differentMetadataTxKoiosResponse = `{
  "tx_hash": "dd8fc82e9ca2d38cffdfb2ab9ec51ea8158f7ade67b95c2dece63de3b8f836a7",
  "block_hash": "87d22e3a156ea1a984bbf7758c29c7efb58cf1b6a4e05e853c3e30d42262ae9c",
  "block_height": 8780716,
  "epoch_no": 412,
  "epoch_slot": 49912,
  "absolute_slot": 92670712,
  "tx_timestamp": 1684237003,
  "tx_block_index": 28,
  "tx_size": 1047,
  "total_output": "1281849555",
  "fee": "227681",
  "deposit": "0",
  "invalid_before": null,
  "invalid_after": "92671082",
  "collateral_inputs": [
    {
      "value": "5000000",
      "tx_hash": "f8b1f77f72c28b2a99ebab191b28d9d7959f0fc9f07c912470050b9ea9a82ce6",
      "tx_index": 4,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": "stake1uxpvguk48qcaldldlqe9nn2q0mnkzhv62fcmy2k780tv8rgxj9j6m",
      "inline_datum": null,
      "payment_addr": {
        "cred": "9ebcd4b1529a6ee9232313b874464924c0fcd776143944ce9263f9ec",
        "bech32": "addr1qx0te49322dxa6fryvfmsazxfyjvplxhwc2rj3xwjf3lnmyzc3ed2wp3m7m7m7pjt8x5qlh8v9we55n3kg4duw7kcwxsdhkgkw"
      },
      "reference_script": null
    }
  ],
  "collateral_output": null,
  "reference_inputs": [],
  "inputs": [
    {
      "value": "350077236",
      "tx_hash": "86bd079733207c6b4ba764fb5408fa59b74ef1733e8b3f9f6e8ef41ac3c048f9",
      "tx_index": 0,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": "stake1uxpvguk48qcaldldlqe9nn2q0mnkzhv62fcmy2k780tv8rgxj9j6m",
      "inline_datum": null,
      "payment_addr": {
        "cred": "b61428273247678082a5a1202ec58f1f56375dfb611769b71caacc41",
        "bech32": "addr1qxmpg2p8xfrk0qyz5ksjqtk93u04vd6alds3w6dhrj4vcsvzc3ed2wp3m7m7m7pjt8x5qlh8v9we55n3kg4duw7kcwxsxt52zf"
      },
      "reference_script": null
    },
    {
      "value": "932000000",
      "tx_hash": "6173600230d8e09bd61520c4f451ab9f1efca9e3a082a149bcc6914896997695",
      "tx_index": 1,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1",
          "policy_id": "40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728",
          "asset_name": "436c61794e6174696f6e39353837",
          "fingerprint": "asset14yxvcdm6u4mqz8dcud8nv0vvxf74ufaqt3shvg"
        }
      ],
      "datum_hash": "f12f4e3c4624767d580206eb0293b564e98cffd31f485494ce20644d97cb72a0",
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "f0c16278fb2dceaa8c32b52f282d6f57ccb6068077a56c7a8f0707a7",
        "bech32": "addr1w8cvzcnclvkua25vx26j72pddatuedsxspm62mr63urs0fctuuzfv"
      },
      "reference_script": null
    }
  ],
  "outputs": [
    {
      "value": "319849555",
      "tx_hash": "dd8fc82e9ca2d38cffdfb2ab9ec51ea8158f7ade67b95c2dece63de3b8f836a7",
      "tx_index": 0,
      "asset_list": [],
      "datum_hash": null,
      "stake_addr": "stake1uxpvguk48qcaldldlqe9nn2q0mnkzhv62fcmy2k780tv8rgxj9j6m",
      "inline_datum": null,
      "payment_addr": {
        "cred": "b61428273247678082a5a1202ec58f1f56375dfb611769b71caacc41",
        "bech32": "addr1qxmpg2p8xfrk0qyz5ksjqtk93u04vd6alds3w6dhrj4vcsvzc3ed2wp3m7m7m7pjt8x5qlh8v9we55n3kg4duw7kcwxsxt52zf"
      },
      "reference_script": null
    },
    {
      "value": "962000000",
      "tx_hash": "dd8fc82e9ca2d38cffdfb2ab9ec51ea8158f7ade67b95c2dece63de3b8f836a7",
      "tx_index": 1,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1",
          "policy_id": "40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728",
          "asset_name": "436c61794e6174696f6e39353837",
          "fingerprint": "asset14yxvcdm6u4mqz8dcud8nv0vvxf74ufaqt3shvg"
        }
      ],
      "datum_hash": "f12f4e3c4624767d580206eb0293b564e98cffd31f485494ce20644d97cb72a0",
      "stake_addr": null,
      "inline_datum": null,
      "payment_addr": {
        "cred": "f0c16278fb2dceaa8c32b52f282d6f57ccb6068077a56c7a8f0707a7",
        "bech32": "addr1w8cvzcnclvkua25vx26j72pddatuedsxspm62mr63urs0fctuuzfv"
      },
      "reference_script": null
    }
  ],
  "withdrawals": [],
  "assets_minted": [],
  "metadata": {
    "674": {
      "msg": [
        "Mutant Labs Raffle",
        "Buy 5 tickets for Raffle 64625b85e66d67ce15babf40"
      ]
    }
  },
  "certificates": [],
  "native_scripts": [],
  "plutus_contracts": [
    {
      "size": 173,
      "input": {
        "datum": {
          "hash": "f12f4e3c4624767d580206eb0293b564e98cffd31f485494ce20644d97cb72a0",
          "value": {
            "fields": [
              {
                "bytes": "5ea504edcfdf2f4ae7f1855b789ab4c0d9cb0f75cb941556d78cdfe3"
              },
              {
                "bytes": "414441"
              },
              {
                "bytes": "414441"
              },
              {
                "int": 6000000
              }
            ]
          }
        },
        "redeemer": {
          "fee": "7212",
          "unit": {
            "mem": "100000",
            "steps": "20000000"
          },
          "datum": {
            "hash": "1b44214718f87314c393e4f1cd32b06bc7df47cf60925fe1ea7393551c170c85",
            "value": {
              "fields": []
            }
          },
          "purpose": "spend"
        }
      },
      "address": "addr1w8cvzcnclvkua25vx26j72pddatuedsxspm62mr63urs0fctuuzfv",
      "bytecode": "58ab0100003232222533357346464640026464660026eb0cc00cc010cc00cc010015200048040020c004004888c94ccd55cf8008a50132325333573466e3c00801052889998030030008021aba2002375c6ae8400400888c8ccc00400520000032223333573466e1c0100095d0919980200219b8000348008d5d100080091aab9e37540022930b1bae0014c11e581ca08ee6a678a207de52061c4ef98209525c9a8af8fe47bbadda50cb850001",
      "script_hash": "f0c16278fb2dceaa8c32b52f282d6f57ccb6068077a56c7a8f0707a7",
      "valid_contract": true
    }
  ]
}`;
export const expectedDifferentMetadataTxResponse = `{"id":"dd8fc82e9ca2d38cffdfb2ab9ec51ea8158f7ade67b95c2dece63de3b8f836a7","inputs":[{"txId":"86bd079733207c6b4ba764fb5408fa59b74ef1733e8b3f9f6e8ef41ac3c048f9","index":0,"value":350077236,"assets":[]},{"txId":"6173600230d8e09bd61520c4f451ab9f1efca9e3a082a149bcc6914896997695","index":1,"value":932000000,"assets":[{"policy_id":"40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728","asset_name":"436c61794e6174696f6e39353837","quantity":1,"fingerprint":"asset14yxvcdm6u4mqz8dcud8nv0vvxf74ufaqt3shvg"}]}],"outputs":[{"address":"addr1qxmpg2p8xfrk0qyz5ksjqtk93u04vd6alds3w6dhrj4vcsvzc3ed2wp3m7m7m7pjt8x5qlh8v9we55n3kg4duw7kcwxsxt52zf","value":319849555,"assets":[]},{"address":"addr1w8cvzcnclvkua25vx26j72pddatuedsxspm62mr63urs0fctuuzfv","value":962000000,"assets":[{"policy_id":"40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728","asset_name":"436c61794e6174696f6e39353837","quantity":1,"fingerprint":"asset14yxvcdm6u4mqz8dcud8nv0vvxf74ufaqt3shvg"}]}],"fee":227681,"metadata":{"674":{"msg":["Mutant Labs Raffle","Buy 5 tickets for Raffle 64625b85e66d67ce15babf40"]}}}`;

export const txBytes =
  '84a400818258205c4f4494618db7e9a3122eb94bb8dc4a8596dbf9d282062ca64475e53c2d9371010182825839010365ded8ab99a8862e248ee53f25e6ea3d6901a1e1aaf42665da948f53812d75db5cd24f281d1bf324237d7d12c69d42d13cafd0620b3013821a002dc6c0a1581ca0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235a145484f534b591a0c26467882581d6153ae5704f4e854362cc8b08b5e0229cfc998b237769eba56157a106c821a3d4aa5f2a3581ca0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481c235a145484f534b591a7b2dbe5c581cbb2250e4c589539fd141fbbd2c322d380f1ce2aaef812cd87110d61ba14e527374434f4d45545654657374321b00000004e38cc250581cd2f6eb37450a3d568de93d623e69bd0ba1238daacc883d75736abd23a14c5273744572675654657374321b0de0b6b06dd70ec0021a00061a80031a056de76fa10081825820c34e5645d83d7c0319d1e73bb8a272592b16bb9b6f450811e52f9bb6f943dec858405aafe73b3a198272c2056836c9268ce145e1b878013cdca62a58ce7ce29dce60fa753b00103705fea1c79af5be2174a7839d137fc7f4ad0ea231208b874dfd04f5f6';

export const addressUtxoSet = `[
  {
    "value": "1344798",
    "tx_hash": "4eb16141fb4f2ca1cabc0dfb16491e54a1b4464b75591ccc3942eb4c6f4273fb",
    "tx_index": 0,
    "asset_list": [
      {
        "decimals": 0,
        "quantity": "64576047",
        "policy_id": "0dad352d8f0d5ce3f5be8b025d6a16141ecceab5a921871792d91f47",
        "asset_name": "5273455247",
        "fingerprint": "asset1p40r0eun2alszlxhj7k4uylya4cj54lxkjjmsm"
      }
    ],
    "block_time": 1678937785,
    "datum_hash": null,
    "block_height": 8522948,
    "inline_datum": null,
    "reference_script": null
  },
  {
    "value": "1344798",
    "tx_hash": "dbd93ef240f7546ce6b8619b6bea4486252bdeaae89d4ee9f74a6fa363d4eb22",
    "tx_index": 0,
    "asset_list": [
      {
        "decimals": 0,
        "quantity": "57617503",
        "policy_id": "0dad352d8f0d5ce3f5be8b025d6a16141ecceab5a921871792d91f47",
        "asset_name": "5273455247",
        "fingerprint": "asset1p40r0eun2alszlxhj7k4uylya4cj54lxkjjmsm"
      }
    ],
    "block_time": 1678937836,
    "datum_hash": null,
    "block_height": 8522950,
    "inline_datum": null,
    "reference_script": null
  },
  {
    "value": "1260649",
    "tx_hash": "454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6",
    "tx_index": 0,
    "asset_list": [],
    "block_time": 1678937862,
    "datum_hash": null,
    "block_height": 8522952,
    "inline_datum": null,
    "reference_script": null
  }
]`;
export const expectedAdressUtxoSet = [
  '{"txId":"4eb16141fb4f2ca1cabc0dfb16491e54a1b4464b75591ccc3942eb4c6f4273fb","index":0,"value":1344798,"assets":[{"policy_id":"0dad352d8f0d5ce3f5be8b025d6a16141ecceab5a921871792d91f47","asset_name":"5273455247","quantity":64576047,"fingerprint":"asset1p40r0eun2alszlxhj7k4uylya4cj54lxkjjmsm"}]}',
  '{"txId":"dbd93ef240f7546ce6b8619b6bea4486252bdeaae89d4ee9f74a6fa363d4eb22","index":0,"value":1344798,"assets":[{"policy_id":"0dad352d8f0d5ce3f5be8b025d6a16141ecceab5a921871792d91f47","asset_name":"5273455247","quantity":57617503,"fingerprint":"asset1p40r0eun2alszlxhj7k4uylya4cj54lxkjjmsm"}]}',
  '{"txId":"454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6","index":0,"value":1260649,"assets":[]}',
];

export const transactionUtxos = `{
  "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
  "inputs": [
    {
      "value": "3000000",
      "tx_hash": "ed688bc21f5ed822adadd1f61415821def778201323c8e998baf350e0647ce49",
      "tx_index": 0,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1455",
          "policy_id": "8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9",
          "asset_name": "52535457",
          "fingerprint": "asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"
        }
      ],
      "stake_addr": "stake1uxct65zymxmshysrlem60j6ddgkhjecczup79euzj8wauxq0r3gc5",
      "payment_addr": {
        "cred": "068186ed813df5f543ee541e1ee1a6dca4cc2ce1e197bc66ee842de2",
        "bech32": "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"
      }
    }
  ],
  "outputs": [
    {
      "value": "1444518",
      "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
      "tx_index": 1,
      "asset_list": [
        {
          "decimals": 0,
          "quantity": "1455",
          "policy_id": "8e3e19131f96c186335b23bf7983ab00867a987ca900abb27ae0f2b9",
          "asset_name": "52535457",
          "fingerprint": "asset1vwun0a52xjv5tc2x92wgr6x3p6q3u4frnmq8q0"
        }
      ],
      "stake_addr": "stake1uxct65zymxmshysrlem60j6ddgkhjecczup79euzj8wauxq0r3gc5",
      "payment_addr": {
        "cred": "068186ed813df5f543ee541e1ee1a6dca4cc2ce1e197bc66ee842de2",
        "bech32": "addr1qyrgrphdsy7lta2rae2pu8hp5mw2fnpvu8se00rxa6zzmc4sh4gyfkdhpwfq8lnh5l95663d09n3s9crutnc9ywamcvqs5e5m6"
      }
    },
    {
      "value": "1286857",
      "tx_hash": "98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3",
      "tx_index": 0,
      "asset_list": [],
      "stake_addr": null,
      "payment_addr": {
        "cred": "cc1e2d66086462a554a4c0813ccc2e01c06eb36e76dd50a268ab314f",
        "bech32": "addr1v8xputtxppjx9f255nqgz0xv9cquqm4ndemd659zdz4nznc7guuzv"
      }
    }
  ]
}`;
export const credentialUtxos = `[
  {
    "tx_hash": "4eb16141fb4f2ca1cabc0dfb16491e54a1b4464b75591ccc3942eb4c6f4273fb",
    "tx_index": 0,
    "value": "1344798"
  },
  {
    "tx_hash": "dbd93ef240f7546ce6b8619b6bea4486252bdeaae89d4ee9f74a6fa363d4eb22",
    "tx_index": 0,
    "value": "1344798"
  },
  {
    "tx_hash": "454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6",
    "tx_index": 0,
    "value": "1260649"
  }
]`;
export const expectedUtxo: CardanoUtxo = {
  txId: '98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3',
  index: 0,
  value: 1286857n,
  assets: [],
};
export const unspentUtxoTransaction = `{
  "tx_hash": "454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6",
  "inputs": [
    {
      "value": "4856006",
      "tx_hash": "26bd963e4d175d96b07a0e3a635449bce168b9de88a6afac7f44184f0683635a",
      "tx_index": 1,
      "asset_list": [],
      "stake_addr": "stake1u9rduxa9z3p03dy60ns4y4h9cqyy669yv4sng6tvvg2g2sq7gcpgw",
      "payment_addr": {
        "cred": "7de25615347dc1570e77113680382c43b8412afb5f44d268feec98da",
        "bech32": "addr1q977y4s4x37uz4cwwugndqpc93pmssf2ld05f5nglmkf3kjxmcd629zzlz6f5l8p2ftwtsqgf452getpx35kccs5s4qqfev2pg"
      }
    }
  ],
  "outputs": [
    {
      "value": "3328448",
      "tx_hash": "454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6",
      "tx_index": 1,
      "asset_list": [],
      "stake_addr": "stake1u9rduxa9z3p03dy60ns4y4h9cqyy669yv4sng6tvvg2g2sq7gcpgw",
      "payment_addr": {
        "cred": "7de25615347dc1570e77113680382c43b8412afb5f44d268feec98da",
        "bech32": "addr1q977y4s4x37uz4cwwugndqpc93pmssf2ld05f5nglmkf3kjxmcd629zzlz6f5l8p2ftwtsqgf452getpx35kccs5s4qqfev2pg"
      }
    },
    {
      "value": "1260649",
      "tx_hash": "454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6",
      "tx_index": 0,
      "asset_list": [],
      "stake_addr": null,
      "payment_addr": {
        "cred": "cc1e2d66086462a554a4c0813ccc2e01c06eb36e76dd50a268ab314f",
        "bech32": "addr1v8xputtxppjx9f255nqgz0xv9cquqm4ndemd659zdz4nznc7guuzv"
      }
    }
  ]
}`;
export const unspentBoxId =
  '454426c78db02b32a02274d926850fad261bb08b3dbfac962ba38c5118856dc6.0';
export const boxId =
  '98884bf40d8ebbd89ad78c6deaa31f0cc47938d941bfc0452bbc9a13aeb37cd3.0';

export const epochParams = {
  epoch_no: 447,
  min_fee_a: 44,
  min_fee_b: 155381,
  max_block_size: 90112,
  max_tx_size: 16384,
  max_bh_size: 1100,
  key_deposit: '2000000',
  pool_deposit: '500000000',
  max_epoch: 18,
  optimal_pool_count: 500,
  influence: 0.3,
  monetary_expand_rate: 0.003,
  treasury_growth_rate: 0.2,
  decentralisation: 0,
  extra_entropy: null,
  protocol_major: 8,
  protocol_minor: 0,
  min_utxo_value: '0',
  min_pool_cost: '170000000',
  nonce: '3cf0a6c3179f521101ceef355b1b3e3d782846f0b9161dd7095e096bbb6536bf',
  block_hash:
    '376ca52b4759cb2a7aa255cbfc93b615c40366d7d043f168796eaa054f622dd9',
  cost_models: {},
  price_mem: 0.0577,
  price_step: 0.0000721,
  max_tx_ex_mem: 14000000,
  max_tx_ex_steps: 10000000000,
  max_block_ex_mem: 62000000,
  max_block_ex_steps: 20000000000,
  max_val_size: 5000,
  collateral_percent: 150,
  max_collateral_inputs: 3,
  coins_per_utxo_size: '4310',
};
export const expectedRequiredParams = {
  minFeeA: 44,
  minFeeB: 155381,
  poolDeposit: '500000000',
  keyDeposit: '2000000',
  maxValueSize: 5000,
  maxTxSize: 16384,
  coinsPerUtxoSize: '4310',
};
