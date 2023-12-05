import { gql } from '@apollo/client/core';

export const currentHeight = gql(`
query currentHeight {
  cardano {
    tip {
      number
    }
  }
}
`);

export const currentSlot = gql(`
query currentSlot {
  cardano {
    tip {
      slotNo
    }
  }
}
`);

export const txBlockInfo = gql(`
query txBlockInfo($where: Transaction_bool_exp) {
  cardano {
    tip {
      number
    }
  }
  transactions(where: $where) {
    block {
      number
    }
  }
}
`);

export const addressAssets = gql(`
query addressAssets($addresses: [String]!) {
  paymentAddresses(addresses: $addresses) {
    summary {
      assetBalances {
        asset {
          assetName
          policyId
        }
        quantity
      }
    }
  }
}
`);

export const blockTxIds = gql(`
query blockTxIds($where: Block_bool_exp) {
  blocks(where: $where) {
    transactions {
      hash
    }
  }
}
`);

export const blockInfo = gql(`
query blockInfo($where: Block_bool_exp) {
  blocks(where: $where) {
    hash
    number
    previousBlock {
      hash
    }
  }
}
`);

export const getTransaction = gql(`
query getTransaction($where: Transaction_bool_exp) {
  transactions(where: $where) {
    hash
    inputs {
      sourceTxIndex
      sourceTxHash
      value
      tokens {
        asset {
          assetName
          policyId
        }
        quantity
      }
    }
    outputs {
      address
      value
      tokens {
        quantity
        asset {
          assetName
          policyId
        }
      }
    }
    fee
    metadata {
      key
      value
    }
  }
}
`);

export const addressUtxos = gql(`
query addressUtxos($where: TransactionOutput_bool_exp, $offset: Int, $limit: Int) {
  utxos(where: $where, offset: $offset, limit: $limit) {
    txHash
    index
    value
    tokens {
      quantity
      asset {
        assetName
        policyId
      }
    }
  }
}
`);

export const getUtxo = gql(`
query getUtxo($where: TransactionOutput_bool_exp) {
  utxos(where: $where) {
    txHash
    index
    value
    tokens {
      quantity
      asset {
        assetName
        policyId
      }
    }
  }
}
`);

export const epochParams = gql(`
query epochParams {
  cardano {
    currentEpoch {
      protocolParams {
        minFeeA
        minFeeB
        poolDeposit
        keyDeposit
        maxValSize
        maxTxSize
        coinsPerUtxoByte
      }
    }
  }
}
`);

export const submitTxMutation = gql(`
mutation SubmitTransaction($transaction: String!) {
  submitTransaction(transaction: $transaction) {
    hash
  }
}
`);
