import {
  PaymentTransaction,
  TransactionType,
} from '@rosen-chains/abstract-chain';
import { EVM_CHAIN } from './constants';

class EVMTransaction extends PaymentTransaction {
  constructor(
    txId: string,
    eventId: string,
    txBytes: Uint8Array,
    txType: TransactionType
  ) {
    super(EVM_CHAIN, txId, eventId, txBytes, txType);
  }

  /**
   * converts json representation of the payment transaction to EVMTransaction
   * @returns EVMTransaction object
   */
  static fromJson = (jsonString: string): EVMTransaction => {
    throw new Error('Not implemented yet.');
  };

  /**
   * converts EVMTransaction to json
   * @returns json representation of the payment transaction
   */
  toJson = (): string => {
    throw new Error('Not implemented yet.');
  };
}

export default EVMTransaction;
