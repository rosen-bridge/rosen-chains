import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { RosenTokens } from '@rosen-bridge/tokens';
import { randomBytes } from 'crypto';
import * as wasm from 'ergo-lib-wasm-nodejs';
import TestErgoNetwork from './network/TestErgoNetwork';
import { ErgoChain, ErgoConfigs } from '../lib';
import { transaction2SignedSerialized } from './transactionTestData';

export const testTokenMap: RosenTokens = JSON.parse(`
{
  "idKeys" : {
    "ergo" : "tokenId",
    "cardano" : "tokenId",
    "bitcoin" : "tokenId"
  },
  "tokens" : []
}
`);

export const testLockAddress =
  '9es3xKFSehNNwCpuNpY31ScAubDqeLbSWwaCysjN1ee51bgHKTq';

export const defaultSignFunction = async (
  tx: wasm.ReducedTransaction,
  requiredSign: number,
  boxes: Array<wasm.ErgoBox>,
  dataBoxes?: Array<wasm.ErgoBox>
): Promise<wasm.Transaction> =>
  deserializeTransaction(transaction2SignedSerialized);

export const observationTxConfirmation = 5;
export const paymentTxConfirmation = 9;
export const coldTxConfirmation = 10;
export const manualTxConfirmation = 11;
export const rwtId =
  '9410db5b39388c6b515160e7248346d7ec63d5457292326da12a26cc02efb526';
export const generateChainObject = (
  network: TestErgoNetwork,
  rwt = rwtId,
  signFn: (
    tx: wasm.ReducedTransaction,
    requiredSign: number,
    boxes: Array<wasm.ErgoBox>,
    dataBoxes?: Array<wasm.ErgoBox>
  ) => Promise<wasm.Transaction> = defaultSignFunction
) => {
  const config: ErgoConfigs = {
    fee: 100n,
    confirmations: {
      observation: observationTxConfirmation,
      payment: paymentTxConfirmation,
      cold: coldTxConfirmation,
      manual: manualTxConfirmation,
    },
    addresses: {
      lock: testLockAddress,
      cold: 'cold_addr',
      permit: 'permit_addr',
      fraud: 'fraud_addr',
    },
    rwtId: rwt,
    minBoxValue: 1000000n,
    eventTxConfirmation: 18,
  };
  // mock a sign function to return signed transaction
  return new ErgoChain(network, config, testTokenMap, signFn);
};

/**
 * generates 32 bytes random data used for the identifiers such as txId
 */
export const generateRandomId = (): string => randomBytes(32).toString('hex');

/**
 * converts json representation of a box into ErgoBox object
 * @param boxJson
 */
export const toErgoBox = (boxJson: string): wasm.ErgoBox =>
  wasm.ErgoBox.from_json(boxJson);

/**
 * converts json representation of a transaction into Transaction object
 * @param txJson
 */
export const toTransaction = (txJson: string): wasm.Transaction =>
  wasm.Transaction.from_json(txJson);

/**
 * deserializes transaction into Transaction object
 * @param serializedTx
 */
export const deserializeTransaction = (
  serializedTx: string
): wasm.Transaction =>
  wasm.Transaction.sigma_parse_bytes(Buffer.from(serializedTx, 'hex'));
