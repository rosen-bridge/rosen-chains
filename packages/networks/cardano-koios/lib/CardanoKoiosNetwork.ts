import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import cardanoKoiosClientFactory, {
  AddressAssets,
  AddressInfo,
  AssetInfo,
} from '@rosen-clients/cardano-koios';
import { KoiosNullValueError } from './types';
import {
  AbstractCardanoNetwork,
  CardanoUtxo,
  CardanoTx,
  CardanoAsset,
  CardanoProtocolParameters,
  CardanoUtils,
} from '@rosen-chains/cardano';
import { RosenTokens } from '@rosen-bridge/tokens';
import {
  AssetBalance,
  BlockInfo,
  FailedError,
  NetworkError,
  TokenDetail,
  TokenInfo,
  UNKNOWN_TOKEN,
  UnexpectedApiError,
} from '@rosen-chains/abstract-chain';
import {
  TxInfoItemInputsItem,
  TxInfoItemOutputsItemAssetListItem,
} from '@rosen-clients/cardano-koios';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';
import JsonBigInt from '@rosen-bridge/json-bigint';

class CardanoKoiosNetwork extends AbstractCardanoNetwork {
  private client: ReturnType<typeof cardanoKoiosClientFactory>;
  extractor: CardanoRosenExtractor;

  constructor(
    koiosUrl: string,
    lockAddress: string,
    tokens: RosenTokens,
    authToken?: string,
    logger?: AbstractLogger
  ) {
    super(logger);
    this.extractor = new CardanoRosenExtractor(lockAddress, tokens, logger);
    this.client = cardanoKoiosClientFactory(koiosUrl, authToken);
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    return this.client
      .getTip()
      .then((block) => {
        this.logger.debug(
          `requested 'getTip'. res: ${JsonBigInt.stringify(block)}`
        );
        const height = block[0].block_no;
        if (height) return Number(height);
        throw new KoiosNullValueError('Height of last block is null');
      })
      .catch((e) => {
        const baseError = `Failed to fetch current height from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + `${e.response.data.reason}`);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
  };

  /**
   * gets confirmation for a transaction
   * @param transactionId the transaction id
   * @returns the transaction confirmation
   */
  getTxConfirmation = async (transactionId: string): Promise<number> => {
    return this.client
      .postTxStatus({ _tx_hashes: [transactionId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postTxStatus' for txId [${transactionId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const confirmation = res[0].num_confirmations;
        if (confirmation !== undefined && confirmation !== null)
          return Number(confirmation);
        return -1;
      })
      .catch((e) => {
        const baseError = `Failed to get confirmation for tx [${transactionId}] from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
  };

  /**
   * gets the amount of each asset in an address
   * @param address the address
   * @returns an object containing the amount of each asset
   */
  getAddressAssets = async (address: string): Promise<AssetBalance> => {
    let nativeToken = 0n;
    let tokens: Array<TokenInfo> = [];

    // get ADA value
    let addressInfo: AddressInfo;
    try {
      addressInfo = await this.client.postAddressInfo({
        _addresses: [address],
      });
      this.logger.debug(
        `requested 'postAddressInfo' for address [${address}]. res: ${JsonBigInt.stringify(
          addressInfo
        )}`
      );
    } catch (e: any) {
      const baseError = `Failed to get address [${address}] assets from Koios: `;
      if (e.response) {
        throw new FailedError(baseError + e.response.data.reason);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    if (addressInfo.length !== 0) {
      if (!addressInfo[0].balance)
        throw new KoiosNullValueError('Address balance is null');
      nativeToken = BigInt(addressInfo[0].balance);
    }

    // get tokens value
    let addressAssets: AddressAssets;
    try {
      addressAssets = await this.client.postAddressAssets({
        _addresses: [address],
      });
      this.logger.debug(
        `requested 'postAddressAssets' for address [${address}]. res: ${JsonBigInt.stringify(
          addressAssets
        )}`
      );
    } catch (e: any) {
      const baseError = `Failed to get address [${address}] assets from Koios: `;
      if (e.response) {
        throw new FailedError(baseError + e.response.data.reason);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }
    tokens = addressAssets.map((asset) => {
      if (
        !asset.policy_id ||
        asset.asset_name === null ||
        asset.asset_name === undefined ||
        !asset.quantity
      )
        throw new KoiosNullValueError('Asset info is null');
      return {
        id: CardanoUtils.generateAssetId(asset.policy_id, asset.asset_name),
        value: BigInt(asset.quantity),
      };
    });

    return {
      nativeToken: nativeToken,
      tokens: tokens,
    };
  };

  /**
   * gets id of all transactions in the given block
   * @param blockId the block id
   * @returns list of the transaction ids in the block
   */
  getBlockTransactionIds = (blockId: string): Promise<Array<string>> => {
    return this.client
      .postBlockTxs({ _block_hashes: [blockId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postBlockTxs' for blockId [${blockId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        return res.map((block) => {
          const txId = block.tx_hash;
          if (!txId) throw new KoiosNullValueError(`Block tx hash is null`);
          return txId;
        });
      })
      .catch((e) => {
        const baseError = `Failed to get block [${blockId}] transaction ids from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
  };

  /**
   * gets info of the given block
   * @param blockId the block id
   * @returns an object containing block info
   */
  getBlockInfo = (blockId: string): Promise<BlockInfo> => {
    return this.client
      .postBlockInfo({ _block_hashes: [blockId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postBlockInfo' for blockId [${blockId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        const block = res[0];
        if (!block.block_height || !block.hash || !block.parent_hash)
          throw new KoiosNullValueError(`Block info data are null`);
        return {
          hash: block.hash,
          parentHash: block.parent_hash,
          height: Number(block.block_height),
        };
      })
      .catch((e) => {
        const baseError = `Failed to get block [${blockId}] info from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
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
    const koiosTx = await this.client
      .postTxInfo({ _tx_hashes: [transactionId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postTxInfo' for txId [${transactionId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        return res[0];
      })
      .catch((e) => {
        const baseError = `Failed to get transaction [${transactionId}] from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
    if (!(koiosTx.tx_hash && koiosTx.inputs && koiosTx.outputs && koiosTx.fee))
      throw new KoiosNullValueError('Tx info items are null');

    if (koiosTx.block_hash !== blockId)
      throw new FailedError(
        `Tx [${transactionId}] doesn't belong to block [${blockId}]`
      );

    const tx: CardanoTx = {
      id: koiosTx.tx_hash,
      inputs: koiosTx.inputs.map(this.parseCardanoUTxO),
      outputs: koiosTx.outputs.map((output) => {
        if (!(output.payment_addr?.bech32 && output.value && output.asset_list))
          throw new KoiosNullValueError('Tx output info items are null');

        return {
          address: output.payment_addr.bech32,
          value: BigInt(output.value),
          assets: output.asset_list.map(this.parseAssetList),
        };
      }),
      fee: BigInt(koiosTx.fee),
    };
    if (koiosTx.metadata) tx.metadata = koiosTx.metadata;

    return tx;
  };

  /**
   * submits a transaction
   * @param transaction the transaction
   */
  submitTransaction = async (transaction: Transaction): Promise<void> => {
    const txBlob = new Blob([transaction.to_bytes()], {
      type: 'application/cbor',
    });
    await this.client.postSubmittx(txBlob);
  };

  /**
   * gets all transactions in mempool (returns empty list if the chain has no mempool)
   * Note: Koios does not support mempool. So function returns empty list
   * @returns empty list
   */
  getMempoolTransactions = async (): Promise<Array<CardanoTx>> => {
    // since Koios does not support mempool, it returns empty list
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
    const boxes = await this.client
      .postAddressInfo({ _addresses: [address] })
      .then((res) => {
        this.logger.debug(
          `requested 'postAddressInfo' for address [${address}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        if (res.length === 0) return [];
        const utxos = res[0].utxo_set;
        if (!utxos) throw new KoiosNullValueError(`Address UTxO list is null`);
        return utxos.map(this.parseCardanoUTxO);
      })
      .catch((e) => {
        const baseError = `Failed to get address [${address}] UTxOs Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
    return boxes.slice(offset, offset + limit);
  };

  /**
   * checks if a box is still unspent and valid
   * @param boxId the box id (txId + . + index)
   * @returns true if the box is unspent and valid
   */
  isBoxUnspentAndValid = async (boxId: string): Promise<boolean> => {
    const [txId, index] = boxId.split('.');
    const tx = await this.client
      .postTxInfo({ _tx_hashes: [txId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postTxUtxos' for txId [${txId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        return res.length === 0 ? undefined : res[0];
      })
      .catch((e) => {
        const baseError = `Failed to get transaction [${txId}] UTxOs from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
    if (!tx) {
      this.logger.debug(
        `Utxo [${boxId}] is invalid. Tx [${txId}] is not found`
      );
      return false;
    }
    const boxAddressCred = tx.outputs?.find(
      (utxo) => utxo.tx_index?.toString() === index
    )?.payment_addr?.cred;
    if (!boxAddressCred)
      throw new KoiosNullValueError(`Box address credential is null`);

    const utxos = await this.client
      .postCredentialUtxos({ _payment_credentials: [boxAddressCred] })
      .catch((e) => {
        const baseError = `Failed to get address credential [${boxAddressCred}] UTxOs from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
    this.logger.debug(
      `requested 'postCredentialUtxos' for box cred [${boxAddressCred}]. res: ${JsonBigInt.stringify(
        utxos
      )}`
    );
    const box = utxos.find(
      (utxo) => utxo.tx_hash === txId && utxo.tx_index?.toString() === index
    );
    return box !== undefined;
  };

  /**
   * gets the current network slot
   * @returns the current network slot
   */
  currentSlot = (): Promise<number> => {
    return this.client
      .getTip()
      .then((block) => {
        this.logger.debug(
          `requested 'getTip'. res: ${JsonBigInt.stringify(block)}`
        );
        const slot = block[0].abs_slot;
        if (slot) return Number(slot);
        throw new KoiosNullValueError('Slot of last block is null');
      })
      .catch((e) => {
        const baseError = `Failed to fetch current slot from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + `${e.response.data.reason}`);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });
  };

  /**
   * gets an utxo from the network
   * @param boxId the id of Utxo (txId + . + index)
   * @returns the utxo
   */
  getUtxo = async (boxId: string): Promise<CardanoUtxo> => {
    const [txId, index] = boxId.split('.');
    const tx = await this.client
      .postTxInfo({ _tx_hashes: [txId] })
      .then((res) => {
        this.logger.debug(
          `requested 'postTxInfo' for txId [${txId}]. res: ${JsonBigInt.stringify(
            res
          )}`
        );
        return res[0];
      })
      .catch((e) => {
        const baseError = `Failed to get transaction [${txId}] UTxOs from Koios: `;
        if (e.response) {
          throw new FailedError(baseError + e.response.data.reason);
        } else if (e.request) {
          throw new NetworkError(baseError + e.message);
        } else {
          throw new UnexpectedApiError(baseError + e.message);
        }
      });

    if (!tx)
      throw new KoiosNullValueError(
        `Tx with [${txId}] id was not found on the blockchain, so none of its utxos can be gotten.`
      );

    const box = tx.outputs?.find((utxo) => utxo.tx_index?.toString() === index);
    if (!box) throw new KoiosNullValueError(`Tx input box is null`);

    return this.parseCardanoUTxO(box);
  };

  /**
   * parses CardanoAssets object from asset_list object returned by Koios
   * @param asset asset_list object
   * @returns CardanoAssets object
   */
  private parseAssetList = (
    asset: TxInfoItemOutputsItemAssetListItem
  ): CardanoAsset => {
    if (
      !(
        asset.policy_id &&
        asset.asset_name !== null &&
        asset.asset_name !== undefined &&
        asset.quantity
      )
    )
      throw new KoiosNullValueError('UTxO asset info items are null');

    return {
      policy_id: asset.policy_id,
      asset_name: asset.asset_name,
      quantity: BigInt(asset.quantity),
    };
  };

  /**
   * parses CardanoUtxo object from input utxo format returned by Koios
   * @param input
   * @returns
   */
  private parseCardanoUTxO = (input: TxInfoItemInputsItem): CardanoUtxo => {
    if (
      !input.tx_hash ||
      input.tx_index === undefined ||
      !input.value ||
      !input.asset_list
    )
      throw new KoiosNullValueError('Tx input info items are null');

    return {
      txId: input.tx_hash,
      index: Number(input.tx_index),
      value: BigInt(input.value),
      assets: input.asset_list.map(this.parseAssetList),
    };
  };

  /**
   * gets required parameters of Cardano Protocol
   * @returns an object containing required protocol parameters
   */
  getProtocolParameters = async (): Promise<CardanoProtocolParameters> => {
    const allParams = await this.client.getEpochParams();
    const epochParams = allParams[0];
    this.logger.debug(
      `requested 'getEpochParams'. index 0: ${JsonBigInt.stringify(
        epochParams
      )}`
    );

    if (
      !epochParams.min_fee_a ||
      !epochParams.min_fee_b ||
      !epochParams.pool_deposit ||
      !epochParams.key_deposit ||
      !epochParams.max_val_size ||
      !epochParams.max_tx_size ||
      !epochParams.coins_per_utxo_size
    )
      throw new KoiosNullValueError(
        `Some required Cardano protocol params are undefined or null `
      );

    return {
      minFeeA: epochParams.min_fee_a,
      minFeeB: epochParams.min_fee_b,
      poolDeposit: epochParams.pool_deposit,
      keyDeposit: epochParams.key_deposit,
      maxValueSize: epochParams.max_val_size,
      maxTxSize: epochParams.max_tx_size,
      coinsPerUtxoSize: epochParams.coins_per_utxo_size,
    };
  };

  /**
   * gets token details (name, decimals)
   * @param tokenId
   */
  getTokenDetail = async (tokenId: string): Promise<TokenDetail> => {
    let tokenDetail: AssetInfo;
    try {
      tokenDetail = await this.client.postAssetInfo({
        _asset_list: [tokenId.split('.')],
      });
      this.logger.debug(
        `requested 'postAssetInfo' for asset [${tokenId}]. res: ${JsonBigInt.stringify(
          tokenDetail
        )}`
      );
    } catch (e: any) {
      const baseError = `Failed to get asset [${tokenId}] info from Koios: `;
      if (e.response) {
        throw new FailedError(baseError + e.response.data.reason);
      } else if (e.request) {
        throw new NetworkError(baseError + e.message);
      } else {
        throw new UnexpectedApiError(baseError + e.message);
      }
    }

    if (tokenDetail.length === 0) throw new FailedError(`Token not found`);
    return {
      tokenId: tokenId,
      name: tokenDetail[0].token_registry_metadata?.name ?? UNKNOWN_TOKEN,
      decimals: tokenDetail[0].token_registry_metadata?.decimals ?? 0,
    };
  };
}

export default CardanoKoiosNetwork;
