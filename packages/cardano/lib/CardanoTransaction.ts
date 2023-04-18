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
}

export default CardanoTransaction;
