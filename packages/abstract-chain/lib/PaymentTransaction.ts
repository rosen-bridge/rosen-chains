import { TransactionType } from './types';

abstract class PaymentTransaction {
  network: string;
  txId: string;
  eventId: string;
  txBytes: Uint8Array;
  txType: TransactionType;

  constructor(
    chain: string,
    txId: string,
    eventId: string,
    txBytes: Uint8Array,
    txType: TransactionType
  ) {
    this.network = chain;
    this.eventId = eventId;
    this.txBytes = txBytes;
    this.txId = txId;
    this.txType = txType;
  }

  /**
   * converts CardanoTransaction to json
   * @returns json representation of the payment transaction
   */
  abstract toJson: () => string;
}

export default PaymentTransaction;
