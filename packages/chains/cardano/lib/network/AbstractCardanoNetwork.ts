import { AbstractUtxoChainNetwork } from '@rosen-chains/abstract-chain';
import { CardanoProtocolParameters, CardanoTx, CardanoUtxo } from '../types';
import { Transaction } from '@emurgo/cardano-serialization-lib-nodejs';

abstract class AbstractCardanoNetwork extends AbstractUtxoChainNetwork<
  CardanoTx,
  CardanoUtxo
> {
  /**
   * submits a transaction (in CardanoWasm serialized hex string)
   * @param transaction the transaction
   */
  declare submitTransaction: (transaction: Transaction) => Promise<void>;

  /**
   * gets the current network slot
   * @returns the current network slot
   */
  abstract currentSlot: () => Promise<number>;

  /**
   * gets an utxo from the network
   * @param boxId the id of Utxo (txId + . + index)
   * @returns the utxo in CardanoUtxo format
   */
  abstract getUtxo: (boxId: string) => Promise<CardanoUtxo>;

  /**
   * gets required parameters of Cardano Protocol
   * @returns an object containing required protocol parameters
   */
  abstract getProtocolParameters: () => Promise<CardanoProtocolParameters>;
}

export default AbstractCardanoNetwork;
