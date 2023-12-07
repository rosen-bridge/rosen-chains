import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import {
  AbstractCardanoNetwork,
  CardanoUtxo,
  CardanoTx,
  CardanoAsset,
  CardanoBoxCandidate,
  CardanoProtocolParameters,
  CardanoMetadata,
  CardanoUtils,
} from '@rosen-chains/cardano';
import { RosenTokens } from '@rosen-bridge/tokens';
import {
  AssetBalance,
  BlockInfo,
  FailedError,
  NetworkError,
  TokenInfo,
  UnexpectedApiError,
} from '@rosen-chains/abstract-chain';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';
import JsonBigInt from '@rosen-bridge/json-bigint';
import {
  ApolloClient,
  ApolloError,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client/core';
import * as Queries from './queries';
import * as Variables from './variables';
import {
  CardanoGraphQLAssetBalance,
  GraphQLTxInputUtxo,
  GraphQLTxOutputUtxo,
  GraphQLTxMetadata,
  GraphQLUtxo,
  GraphQLNullValueError,
} from './types';
import * as GraphQLTypes from './graphQLTypes';

class CardanoGraphQLNetwork extends AbstractCardanoNetwork {
  protected client: ApolloClient<NormalizedCacheObject>;
  extractor: CardanoRosenExtractor;

  constructor(
    graphqlUri: string,
    lockAddress: string,
    tokens: RosenTokens,
    logger?: AbstractLogger
  ) {
    super(logger);
    this.extractor = new CardanoRosenExtractor(lockAddress, tokens, logger);
    this.client = new ApolloClient({
      cache: new InMemoryCache(),
      uri: graphqlUri,
    });
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    return this.client
      .query<GraphQLTypes.CurrentHeightQuery>({
        query: Queries.currentHeight,
      })
      .then((res) => {
        this.logger.debug(
          `requested 'currentHeight'. res: ${JsonBigInt.stringify(res)}`
        );
        const height = res.data.cardano.tip.number;
        if (height) return height;
        throw new GraphQLNullValueError(`Height is not number: [${height}]`);
      })
      .catch((e) => {
        const baseError = `Failed to fetch current height from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets confirmation for a transaction (returns -1 if tx is not mined or found)
   * @param transactionId the transaction id
   * @returns the transaction confirmation
   */
  getTxConfirmation = async (transactionId: string): Promise<number> => {
    return this.client
      .query<GraphQLTypes.TxBlockInfoQuery>({
        query: Queries.txBlockInfo,
        variables: Variables.hashVariables(transactionId),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'txBlockInfo' for txId [${transactionId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const currentHeight = res.data.cardano.tip.number;
        const txs = res.data.transactions;
        if (!txs.length) return -1;
        else if (currentHeight && txs[0]?.block?.number)
          return currentHeight - txs[0].block.number;
        else
          throw new GraphQLNullValueError(
            `Heights are not number. Current height [${currentHeight}], Tx height:[${txs[0]?.block?.number}]`
          );
      })
      .catch((e) => {
        const baseError = `Failed to get confirmation for tx [${transactionId}] from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets the amount of each asset in an address
   * @param address the address
   * @returns an object containing the amount of each asset
   */
  getAddressAssets = async (address: string): Promise<AssetBalance> => {
    let nativeToken = 0n;
    const tokens: Array<TokenInfo> = [];

    return this.client
      .query<GraphQLTypes.AddressAssetsQuery>({
        query: Queries.addressAssets,
        variables: Variables.addressVariables(address),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'addressAssets' for address [${address}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const addresses = res.data.paymentAddresses;
        if (!addresses || !addresses[0]?.summary?.assetBalances)
          return { nativeToken, tokens };

        const assets = addresses[0].summary.assetBalances;
        // get ADA value
        const adaAmount = assets.find(
          (balance) => balance?.asset.policyId === 'ada'
        )?.quantity;
        if (!adaAmount) return { nativeToken, tokens };
        nativeToken = BigInt(adaAmount);
        // get tokens value
        assets.forEach((balance) => {
          if (!balance)
            throw new GraphQLNullValueError(`Token balance is invalid`);
          if (balance.asset.policyId === 'ada') return;
          tokens.push({
            id: CardanoUtils.generateAssetId(
              balance.asset.policyId,
              balance.asset.assetName
            ),
            value: BigInt(balance.quantity),
          });
        });
        return { nativeToken, tokens };
      })
      .catch((e) => {
        const baseError = `Failed to get address [${address}] assets from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets id of all transactions in the given block
   * @param blockId the block id
   * @returns list of the transaction ids in the block
   */
  getBlockTransactionIds = async (blockId: string): Promise<Array<string>> => {
    return this.client
      .query<GraphQLTypes.BlockTxIdsQuery>({
        query: Queries.blockTxIds,
        variables: Variables.hashVariables(blockId),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'blockTxIds' for blockId [${blockId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const blocks = res.data.blocks;
        if (!blocks.length) throw new FailedError(`Block not found`);
        if (!blocks[0]) throw new GraphQLNullValueError(`Invalid block data`);
        return blocks[0].transactions.map((tx) => {
          if (tx) return tx.hash;
          else
            throw new GraphQLNullValueError(`Block transaction id is invalid`);
        });
      })
      .catch((e) => {
        const baseError = `Failed to get block [${blockId}] transaction ids from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets info of the given block
   * @param blockId the block id
   * @returns an object containing block info
   */
  getBlockInfo = async (blockId: string): Promise<BlockInfo> => {
    return this.client
      .query<GraphQLTypes.BlockInfoQuery>({
        query: Queries.blockInfo,
        variables: Variables.hashVariables(blockId),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'blockInfo' for blockId [${blockId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const blocks = res.data.blocks;
        if (!blocks.length) throw new FailedError(`Block not found`);
        if (!blocks[0] || !blocks[0].previousBlock?.hash || !blocks[0].number)
          throw new GraphQLNullValueError(`Invalid block data`);
        return {
          hash: blocks[0].hash,
          parentHash: blocks[0].previousBlock.hash,
          height: blocks[0].number,
        };
      })
      .catch((e) => {
        const baseError = `Failed to get block [${blockId}] info from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets a transaction (serialized in `CardanoTx` format)
   * @param transactionId the transaction id
   * @param blockId the block id
   * @returns the transaction
   */
  getTransaction = async (
    transactionId: string,
    blockId: string
  ): Promise<CardanoTx> => {
    return this.client
      .query<GraphQLTypes.GetTransactionQuery>({
        query: Queries.getTransaction,
        variables: Variables.getTxVariables(transactionId, blockId),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'getTransaction' for txId [${transactionId}] with block [${blockId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const txs = res.data.transactions;
        if (!txs.length)
          throw new FailedError(`Transaction with given block not found`);
        if (!txs[0] || !txs[0].hash || !txs[0].fee)
          throw new GraphQLNullValueError(`Invalid block data`);
        return {
          id: txs[0].hash,
          inputs: txs[0].inputs.map(this.txInputToCardanoUTxO),
          outputs: txs[0].outputs.map(this.txOutputToCardanoBoxCandidate),
          fee: BigInt(txs[0].fee),
          metadata: this.parseMetadata(txs[0].metadata),
        };
      })
      .catch((e) => {
        const baseError = `Failed to get transaction [${transactionId}] with block [${blockId}] from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  submitTransaction = async (transaction: Transaction): Promise<void> => {
    await this.client.mutate<GraphQLTypes.SubmitTransactionMutation>({
      mutation: Queries.submitTxMutation,
      variables: Variables.submitTxVariables(transaction.to_hex()),
    });
  };

  /**
   * gets all transactions in mempool (returns empty list if the chain has no mempool)
   * Note: We don't use Cardano mempool. So it returns empty list
   * @returns empty list
   */
  getMempoolTransactions = async (): Promise<Array<CardanoTx>> => {
    // We don't use Cardano mempool. So it returns empty list
    return [];
  };

  /**
   * gets confirmed and unspent boxes of an address
   * @param address the address
   * @param offset
   * @param limit
   * @returns list of boxes
   */
  getAddressBoxes = async (
    address: string,
    offset: number,
    limit: number
  ): Promise<Array<CardanoUtxo>> => {
    return this.client
      .query<GraphQLTypes.AddressUtxosQuery>({
        query: Queries.addressUtxos,
        variables: Variables.addressUtxosVariables(address, offset, limit),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'addressUtxos' for address [${address}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        return res.data.utxos.map(this.utxoToCardanoUTxO);
      })
      .catch((e) => {
        const baseError = `Failed to get address [${address}] utxos from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * checks if a box is still unspent and valid
   * @param boxId the box id (txId + . + index)
   * @returns true if the box is unspent and valid
   */
  isBoxUnspentAndValid = async (boxId: string): Promise<boolean> => {
    const [txId, index] = boxId.split('.');
    return this.client
      .query<GraphQLTypes.GetUtxoQuery>({
        query: Queries.getUtxo,
        variables: Variables.getUtxoVariables(txId, Number(index)),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'getUtxo' for box [${boxId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const utxos = res.data.utxos;
        if (!utxos.length) return false;
        return true;
      })
      .catch((e) => {
        const baseError = `Failed to get box [${boxId}] from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets the current network slot
   * @returns the current network slot
   */
  currentSlot = async (): Promise<number> => {
    return this.client
      .query<GraphQLTypes.CurrentSlotQuery>({
        query: Queries.currentSlot,
      })
      .then((res) => {
        this.logger.debug(
          `requested 'currentSlot'. res: ${JsonBigInt.stringify(res)}`
        );
        return Number(res.data.cardano.tip.slotNo);
      })
      .catch((e) => {
        const baseError = `Failed to fetch current slot from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets an utxo from the network
   * @param boxId the id of Utxo (txId + . + index)
   * @returns the utxo
   */
  getUtxo = async (boxId: string): Promise<CardanoUtxo> => {
    const [txId, index] = boxId.split('.');
    return this.client
      .query<GraphQLTypes.GetUtxoQuery>({
        query: Queries.getUtxo,
        variables: Variables.getUtxoVariables(txId, Number(index)),
      })
      .then((res) => {
        this.logger.debug(
          `requested 'getUtxo' for box [${boxId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const utxos = res.data.utxos;
        if (!utxos.length) throw new FailedError(`Box not found`);
        return this.utxoToCardanoUTxO(utxos[0]);
      })
      .catch((e) => {
        const baseError = `Failed to get box [${boxId}] from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * gets required parameters of Cardano Protocol
   * @returns an object containing required protocol parameters
   */
  getProtocolParameters = async (): Promise<CardanoProtocolParameters> => {
    return this.client
      .query<GraphQLTypes.EpochParamsQuery>({
        query: Queries.epochParams,
      })
      .then((res) => {
        this.logger.debug(
          `requested 'epochParams'. res: ${JsonBigInt.stringify(res)}`
        );
        const params = res.data.cardano.currentEpoch.protocolParams;
        if (!params)
          throw new GraphQLNullValueError(`Invalid epoch protocol params`);
        return {
          minFeeA: params.minFeeA,
          minFeeB: params.minFeeB,
          poolDeposit: params.poolDeposit,
          keyDeposit: params.keyDeposit,
          maxValueSize: Number(params.maxValSize),
          maxTxSize: params.maxTxSize,
          coinsPerUtxoSize: params.coinsPerUtxoByte,
        };
      })
      .catch((e) => {
        const baseError = `Failed to fetch protocol params from GraphQL: `;
        throw this.handleClientError(e, baseError);
      });
  };

  /**
   * converts CardanoAssets object from GraphQLAsset
   * @param balance CardanoGraphQLAssetBalance object
   * @returns CardanoAssets object
   */
  protected balanceToCardanoAssets = (
    balance: CardanoGraphQLAssetBalance
  ): CardanoAsset => {
    if (!balance) throw new GraphQLNullValueError(`Invalid token balance`);
    return {
      policy_id: balance.asset.policyId,
      asset_name: balance.asset.assetName,
      quantity: BigInt(balance.quantity),
    };
  };

  /**
   * converts GraphQL tx input schema to CardanoUtxo
   * @param input
   * @returns
   */
  protected utxoToCardanoUTxO = (input: GraphQLUtxo): CardanoUtxo => {
    if (!input) throw new GraphQLNullValueError(`Invalid utxo data`);
    return {
      txId: input.txHash,
      index: input.index,
      value: BigInt(input.value),
      assets: input.tokens.map(this.balanceToCardanoAssets),
    };
  };

  /**
   * converts GraphQL tx input schema to CardanoUtxo
   * @param input
   * @returns
   */
  protected txInputToCardanoUTxO = (input: GraphQLTxInputUtxo): CardanoUtxo => {
    return {
      txId: input.sourceTxHash,
      index: input.sourceTxIndex,
      value: BigInt(input.value),
      assets: input.tokens.map(this.balanceToCardanoAssets),
    };
  };

  /**
   * converts GraphQL tx output schema to CardanoBoxCandidate
   * @param output
   * @returns
   */
  protected txOutputToCardanoBoxCandidate = (
    output: GraphQLTxOutputUtxo
  ): CardanoBoxCandidate => {
    if (!output) throw new GraphQLNullValueError(`Invalid output utxo data`);
    return {
      address: output.address,
      value: BigInt(output.value),
      assets: output.tokens.map(this.balanceToCardanoAssets),
    };
  };

  /**
   * parses metadata object from GraphQL tx metadata schema
   * @param output
   * @returns
   */
  protected parseMetadata = (
    metadata: GraphQLTxMetadata
  ): CardanoMetadata | undefined => {
    if (!metadata || !Object.keys(metadata).length) return undefined;
    return metadata.reduce((result: CardanoMetadata, labelObject) => {
      if (!labelObject || !labelObject.key || !labelObject.value)
        throw new GraphQLNullValueError(`Invalid metadata element`);
      return {
        ...result,
        [labelObject.key]: labelObject.value,
      };
    }, {});
  };

  /**
   * handles client error
   *  returns NetworkError if error has no status code
   *  otherwise returns UnexpectedApiError
   * @param e
   * @param baseError
   */
  private handleClientError = (e: any, baseError: string) => {
    if (e instanceof FailedError) {
      e.message = baseError + e.message;
      throw e;
    }
    if (e instanceof ApolloError && e.networkError) {
      if (Object.hasOwn(e.networkError, 'statusCode'))
        return new UnexpectedApiError(baseError + e.message);
      return new NetworkError(baseError + e.message);
    } else {
      return new UnexpectedApiError(baseError + e.message);
    }
  };
}

export default CardanoGraphQLNetwork;
