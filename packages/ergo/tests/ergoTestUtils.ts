import { randomBytes } from 'crypto';
import * as wasm from 'ergo-lib-wasm-nodejs';

export const testLockAddress =
  '9es3xKFSehNNwCpuNpY31ScAubDqeLbSWwaCysjN1ee51bgHKTq';

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
