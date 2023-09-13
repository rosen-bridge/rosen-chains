import {
  PaymentTransaction,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { CARDANO_CHAIN } from './constants';
import { CardanoTransactionJsonModel } from './types';

class CardanoTransaction implements PaymentTransaction {
  eventId: string;
  network: string;
  txBytes: Uint8Array;
  txId: string;
  txType: TransactionType;
  inputUtxos: Array<string>;

  constructor(
    eventId: string,
    txBytes: Uint8Array,
    txId: string,
    txType: TransactionType,
    inputUtxos: Array<string>
  ) {
    this.network = CARDANO_CHAIN;
    this.eventId = eventId;
    this.txBytes = txBytes;
    this.txId = txId;
    this.txType = txType;
    this.inputUtxos = inputUtxos;
  }

  /**
   * converts json representation of the payment transaction to CardanoTransaction
   * @returns CardanoTransaction object
   */
  static fromJson = (jsonString: string): CardanoTransaction => {
    const obj = JSON.parse(jsonString) as CardanoTransactionJsonModel;
    return new CardanoTransaction(
      obj.eventId,
      Buffer.from(obj.txBytes, 'hex'),
      obj.txId,
      obj.txType as TransactionType,
      obj.inputUtxos
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
      inputUtxos: this.inputUtxos,
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
