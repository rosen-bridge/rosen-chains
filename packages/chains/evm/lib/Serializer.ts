import { Transaction } from 'ethers';

class Serializer {
  /**
   * converts the transaction model in the chain to bytearray
   * @param tx the transaction model in the chain library
   * @returns bytearray representation of the transaction
   */
  static serialize = (tx: Transaction): Uint8Array => {
    return Buffer.from(tx.unsignedSerialized.substring(2), 'hex');
  };

  /**
   * converts bytearray representation of the unsigned transaction to the transaction model in the chain
   * @param txBytes bytearray representation of the transaction
   * @returns the transaction model in the chain library
   */
  static deserialize = (txBytes: Uint8Array): Transaction => {
    return Transaction.from('0x' + (txBytes as Buffer).toString('hex'));
  };

  /**
   * converts the signed transaction model in the chain to bytearray
   * @param tx the transaction model in the chain library
   * @returns bytearray representation of the transaction
   */
  static signedSerialize = (tx: Transaction): Uint8Array => {
    return Buffer.from(tx.serialized.substring(2), 'hex');
  };

  /**
   * converts bytearray representation of the signed transaction to the transaction model in the chain
   * @param txBytes bytearray representation of the transaction
   * @returns the transaction model in the chain library
   */
  static signedDeserialize = (txBytes: Uint8Array): Transaction => {
    return Transaction.from('0x' + (txBytes as Buffer).toString('hex'));
  };
}

export default Serializer;
