export interface CardanoGraphQLAssetBalance {
  asset: {
    assetName: string;
    policyId: string;
  };
  quantity: string;
}

export interface GraphQLTxInputUtxo {
  sourceTxIndex: number;
  sourceTxHash: string;
  value: string;
  tokens: Array<CardanoGraphQLAssetBalance>;
}

export interface GraphQLTxOutputUtxo {
  address: string;
  value: string;
  tokens: Array<CardanoGraphQLAssetBalance>;
}

export interface GraphQLUtxo {
  txHash: string;
  index: number;
  value: string;
  tokens: Array<CardanoGraphQLAssetBalance>;
}

export interface GraphQLMetadataField {
  key: string;
  value: string | Record<string, any>;
}

export type GraphQLTxMetadata = Array<GraphQLMetadataField>;
