import cardanoKoiosClientFactory from '@rosen-clients/cardano-koios';
import * as testData from '../testData';
import {
  AddressInfoItemUtxoSetItem,
  CredentialUtxos,
  TxInfoItem,
  TxUtxos,
} from '@rosen-clients/cardano-koios';

/**
 * mock `getTip` of cardano koios client
 */
export const mockGetTip = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    getTip: async () => [
      {
        block_no: testData.blockHeight,
        abs_slot: testData.absoluteSlot,
      },
    ],
  } as any);
};

/**
 * mock `postTxStatus` of cardano koios client
 */
export const mockPostTxStatus = (txId: string, confirmation: bigint | null) => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postTxStatus: async () => [
      {
        tx_has: txId,
        num_confirmations: confirmation,
      },
    ],
  } as any);
};

/**
 * mock `postAddressInfo` and `postAddressAssets` of cardano koios client
 */
export const mockAddressAssets = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postAddressInfo: async () => [
      {
        balance: testData.addressBalance,
      },
    ],
    postAddressAssets: async () => [
      {
        asset_list: testData.addressAssets,
      },
    ],
  } as any);
};

/**
 * mock `postAddressInfo` and `postAddressAssets` of cardano koios client
 * so that address balance is 0 and contains no assets
 */
export const mockEmptyAddressAssets = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postAddressInfo: async () => [
      {
        balance: '0',
      },
    ],
    postAddressAssets: async () => [],
  } as any);
};

/**
 * mock `postAddressInfo` and `postAddressAssets` of cardano koios client
 * so that address has no info and contains no assets
 */
export const mockNoHistoryAddressAssets = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postAddressInfo: async () => [],
    postAddressAssets: async () => [],
  } as any);
};

/**
 * mock `postBlockTxs` of cardano koios client
 */
export const mockPostBlockTxs = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postBlockTxs: async () => [
      {
        tx_hashes: testData.txHashes,
      },
    ],
  } as any);
};

/**
 * mock `postBlockInfo` of cardano koios client
 */
export const mockPostBlockInfo = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postBlockInfo: async () => [
      {
        hash: testData.blockId,
        block_height: testData.oldBlockheight,
        parent_hash: testData.parentBlockId,
      },
    ],
  } as any);
};

/**
 * mock `postTxInfo` of cardano koios client
 */
export const mockPostTxInfo = (response: TxInfoItem) => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postTxInfo: async () => [response],
  } as any);
};

/**
 * mock `postSubmittx` of cardano koios client
 */
export const mockPostSubmittx = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postSubmittx: async () => testData.txId,
  } as any);
};

/**
 * mock `postAddressInfo` of cardano koios client
 */
export const mockPostAddressInfo = (utxoSet: AddressInfoItemUtxoSetItem[]) => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postAddressInfo: async () => [
      {
        utxo_set: utxoSet,
      },
    ],
  } as any);
};

/**
 * mock `postTxUtxos` and `postCredentialUtxos` of cardano koios client
 */
export const mockUtxoValidation = (
  txUtxos: TxUtxos | undefined,
  credentialUtxos: CredentialUtxos
) => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postTxUtxos: async () => (txUtxos ? [txUtxos] : []),
    postCredentialUtxos: async () => credentialUtxos,
  } as any);
};

/**
 * mock `postAddressInfo` of cardano koios client
 * so that address has no utxo
 */
export const mockPostAddressInfoNoHistory = () => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postAddressInfo: async () => [],
  } as any);
};

/**
 * mock `postTxUtxos` of cardano koios client
 */
export const mockPostTxUtxos = (utxos: TxUtxos) => {
  jest.mocked(cardanoKoiosClientFactory).mockReturnValueOnce({
    postTxUtxos: async () => [utxos],
  } as any);
};
