import { UnexpectedApiError } from '@rosen-chains/abstract-chain';
import { GetTransactionQuery, GetUtxoQuery } from './graphQLTypes';

export type CardanoGraphQLAssetBalance = NonNullable<
  GetTransactionQuery['transactions'][0]
>['inputs'][0]['tokens'][0];

export type GraphQLTxInputUtxo = NonNullable<
  GetTransactionQuery['transactions'][0]
>['inputs'][0];

export type GraphQLTxOutputUtxo = NonNullable<
  GetTransactionQuery['transactions'][0]
>['outputs'][0];

export type GraphQLTxMetadata = NonNullable<
  GetTransactionQuery['transactions'][0]
>['metadata'];

export type GraphQLUtxo = GetUtxoQuery['utxos'][0];

export class GraphQLNullValueError extends UnexpectedApiError {
  constructor(msg: string) {
    super('GraphQLNullValueError: ' + msg);
  }
}
