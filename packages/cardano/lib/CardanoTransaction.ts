import { PaymentTransaction } from '@rosen-chains/abstract-chain';
import { CARDANO_CHAIN } from './constants';

class CardanoTransaction implements PaymentTransaction {
  eventId: string;
  network: string;
  txBytes: Uint8Array;
  txId: string;
  txType: string;
  inputBoxes: Array<string>;

  constructor(
    eventId: string,
    txBytes: Uint8Array,
    txId: string,
    txType: string,
    inputBoxes: Array<string>
  ) {
    this.network = CARDANO_CHAIN;
    this.eventId = eventId;
    this.txBytes = txBytes;
    this.txId = txId;
    this.txType = txType;
    this.inputBoxes = inputBoxes;
  }

  /**
   * converts json representation of the payment transaction to CardanoTransaction
   * @returns CardanoTransaction object
   */
  static fromJson = (jsonString: string): CardanoTransaction => {
    const obj = JSON.parse(jsonString);
    return new CardanoTransaction(
      obj.eventId,
      Buffer.from(obj.txBytes, 'hex'),
      obj.txId,
      obj.txType,
      obj.inputBoxes
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
      txBytes: this.getTxHexString(),
      txId: this.txId,
      txType: this.txType,
      inputBoxes: this.inputBoxes,
    });
  };

  /**
   * @returns transaction hex string
   */
  getTxHexString = () => {
    return Buffer.from(this.txBytes).toString('hex');
  };
}

export default CardanoTransaction;
