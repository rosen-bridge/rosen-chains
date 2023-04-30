import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

class Serializer {
  /**
   * converts the transaction model in the chain to bytearray
   * @param tx the transaction model in the chain library
   * @returns bytearray representation of the transaction
   */
  static serialize = (tx: Transaction): Uint8Array => {
    return tx.to_bytes();
  };

  /**
   * converts bytearray representation of the transaction to the transaction model in the chain
   * @param txBytes bytearray representation of the transaction
   * @returns the transaction model in the chain library
   */
  static deserialize = (txBytes: Uint8Array): Transaction => {
    return Transaction.from_bytes(txBytes);
  };
}

export default Serializer;
