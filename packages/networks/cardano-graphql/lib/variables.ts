export const hashVariables = (txId: string) => ({
  where: {
    hash: {
      _eq: txId,
    },
  },
});

export const addressVariables = (address: string) => ({
  addresses: [address],
});

export const getTxVariables = (txId: string, blockId: string) => ({
  where: {
    block: {
      hash: {
        _eq: blockId,
      },
    },
    hash: {
      _eq: txId,
    },
  },
});

export const addressUtxosVariables = (
  address: string,
  offset: number,
  limit: number
) => ({
  where: {
    address: {
      _eq: address,
    },
  },
  offset: offset,
  limit: limit,
});

export const getUtxoVariables = (txId: string, index: number) => ({
  where: {
    transaction: {
      hash: {
        _eq: txId,
      },
    },
    index: {
      _eq: index,
    },
  },
});

export const submitTxVariables = (txHex: string) => ({
  transaction: txHex,
});

export const assetIdVariables = (assetId: string) => ({
  where: {
    assetId: {
      _eq: assetId,
    },
  },
});
