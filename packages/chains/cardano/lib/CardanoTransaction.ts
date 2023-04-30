import { PaymentTransaction } from '@rosen-chains/abstract-chain';
import { CARDANO_CHAIN } from './constants';

class CardanoTransaction implements PaymentTransaction {
  eventId: string;
  network: string;
  txBytes: Uint8Array;
  txId: string;
  txType: string;

  constructor(
    eventId: string,
    txBytes: Uint8Array,
    txId: string,
    txType: string
  ) {
    this.network = CARDANO_CHAIN;
    this.eventId = eventId;
    this.txBytes = txBytes;
    this.txId = txId;
    this.txType = txType;
  }

  /**
   * converts json representation of the payment transaction to CardanoTransaction
   * @returns CardanoTransaction object
   */
  static fromJson = (jsonString: string): CardanoTransaction => {
    const obj = JSON.parse(jsonString);
    return new CardanoTransaction(
      obj.eventId,
      obj.txBytes,
      obj.txId,
      obj.txType
    );
  };

  /**
   * converts ErgoTransaction to json
   * @returns json representation of the payment transaction
   */
  toJson = (): string => {
    return JSON.stringify({
      network: this.network,
      eventId: this.eventId,
      txBytes: this.txBytes,
      txId: this.txId,
      txType: this.txType,
    });
  };

  /**
   * @returns transaction hex string
   */
  getTxString = (): string => {
    return Buffer.from(this.txBytes).toString();
  };
}

export default CardanoTransaction;
