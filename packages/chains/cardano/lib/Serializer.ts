import { CardanoTx, SignedCardanoTx } from './types';

class Serializer {
  /**
   * converts the transaction model in the CardanoTx to byteArray
   * @param tx the transaction model in the CardanoTx format
   * @returns byteArray representation of the transaction
   */
  static serialize = (tx: CardanoTx): Uint8Array => {
    return Buffer.from(JSON.stringify(tx));
  };

  /**
   * converts bytearray representation of the transaction to the CardanoTx format
   * @param txBytes bytearray representation of the transaction
   * @returns the transaction model in the CardanoTx format
   */
  static deserialize = (txBytes: Uint8Array): CardanoTx => {
    return JSON.parse(Buffer.from(txBytes).toString());
  };

  /**
   * converts the signed CardanoTx to bytearray
   * @param tx the transaction model in the SignedCardanoTx format
   * @returns bytearray representation of the transaction
   */
  static signedSerialize = (tx: SignedCardanoTx): Uint8Array => {
    return Buffer.from(JSON.stringify(tx));
  };

  /**
   * converts bytearray representation of the signed transaction to the SignedCardanoTx type
   * @param txBytes bytearray representation of the transaction
   * @returns the transaction model in the SignedCardanoTx format
   */
  static signedDeserialize = (txBytes: Uint8Array): SignedCardanoTx => {
    return JSON.parse(Buffer.from(txBytes).toString());
  };
}

export default Serializer;
