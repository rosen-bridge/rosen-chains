import { AbstractLogger } from '@rosen-bridge/logger-interface';
import { CardanoRosenExtractor } from '@rosen-bridge/rosen-extractor';
import cardanoKoiosClientFactory, {
  AddressAssets,
  AddressInfo,
} from '@rosen-clients/cardano-koios';
import JsonBigIntFactory from 'json-bigint';
import { KoiosNullValueError } from './types';
import {
  AbstractCardanoNetwork,
  CardanoUtxo,
  CardanoTx,
  CardanoAsset,
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
import {
  TxInfoItemInputsItem,
  TxInfoItemOutputsItemAssetListItem,
} from '@rosen-clients/cardano-koios';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

class CardanoKoiosNetwork extends AbstractCardanoNetwork {
  private client: ReturnType<typeof cardanoKoiosClientFactory>;
  extractor: CardanoRosenExtractor;

  constructor(
    koiosUrl: string,
    lockAddress: string,
    tokens: RosenTokens,
    logger?: AbstractLogger
  ) {
    super(logger);
    this.extractor = new CardanoRosenExtractor(lockAddress, tokens, logger);
    this.client = cardanoKoiosClientFactory(koiosUrl);
  }

  /**
   * gets the blockchain height
   * @returns the blockchain height
   */
  getHeight = async (): Promise<number> => {
    return this.client
      .getTip()
      .then((block) => {
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
        const confirmation = res[0].num_confirmations;
        if (confirmation) return Number(confirmation);
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
    if (addressAssets.length !== 0) {
      if (!addressAssets[0].asset_list)
        throw new KoiosNullValueError('Address asset_list is null');
      const assets = addressAssets[0].asset_list;
      tokens = assets.map((asset) => {
        if (!asset.fingerprint || !asset.quantity)
          throw new KoiosNullValueError('Asset info is null');
        return {
          id: asset.fingerprint,
          value: BigInt(asset.quantity),
        };
      });
    }

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
        const txIds = res[0].tx_hashes;
        if (!txIds)
          throw new KoiosNullValueError(`Block tx hashes list is null`);
        return txIds;
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
      .then((res) => res[0])
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
    return boxes.slice(offset, limit);
  };

  /**
   * checks if a box is still unspent and valid
   * @param boxId the box id (txId + . + index)
   * @returns true if the box is unspent and valid
   */
  isBoxUnspentAndValid = async (boxId: string): Promise<boolean> => {
    const [txId, index] = boxId.split('.');
    const tx = await this.client
      .postTxUtxos({ _tx_hashes: [txId] })
      .then((res) => (res.length === 0 ? undefined : res[0]))
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
      .postTxUtxos({ _tx_hashes: [txId] })
      .then((res) => res[0])
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
        asset.asset_name &&
        asset.quantity &&
        asset.fingerprint
      )
    )
      throw new KoiosNullValueError('UTxO asset info items are null');

    return {
      policy_id: asset.policy_id,
      asset_name: asset.asset_name,
      quantity: BigInt(asset.quantity),
      fingerprint: asset.fingerprint,
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
}

export default CardanoKoiosNetwork;
