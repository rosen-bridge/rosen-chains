import { PaymentTransaction } from '@rosen-chains/abstract-chain';

class CardanoTransaction implements PaymentTransaction {
  eventId: string;
  network: string;
  txBytes: Uint8Array;
  txId: string;
  txType: string;

  constructor(
    eventId: string,
    network: string,
    txBytes: Uint8Array,
    txId: string,
    txType: string
  ) {
    this.eventId = eventId;
    this.network = network;
    this.txBytes = txBytes;
    this.txId = txId;
    this.txType = txType;
  }
}
