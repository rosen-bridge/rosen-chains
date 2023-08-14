import {
  PaymentTransaction,
  PaymentTransactionJsonModel,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { CARDANO_CHAIN } from './constants';

class CardanoTransaction implements PaymentTransaction {
  eventId: string;
  network: string;
  txBytes: Uint8Array;
  txId: string;
  txType: TransactionType;

  constructor(
    eventId: string,
    txBytes: Uint8Array,
    txId: string,
    txType: TransactionType
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
    const obj = JSON.parse(jsonString) as PaymentTransactionJsonModel;
    return new CardanoTransaction(
      obj.eventId,
      Buffer.from(obj.txBytes, 'hex'),
      obj.txId,
      obj.txType as TransactionType
    );
  };

  /**
   * converts CardanoTransaction to json
   * @returns json representation of the payment transaction
   */
  toJson = (): string => {
    return JSON.stringify({
      network: this.network,
      eventId: this.eventId,
      txBytes: this.getTxHexString(),
      txId: this.txId,
      txType: this.txType,
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
