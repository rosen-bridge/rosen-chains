import {
  ChainConfigs,
  PaymentTransactionJsonModel,
} from '@rosen-chains/abstract-chain';

interface ErgoConfigs extends ChainConfigs {
  minBoxValue: bigint;
  eventTxConfirmation: number;
}

interface ErgoTransactionJsonModel extends PaymentTransactionJsonModel {
  inputBoxes: Array<string>;
  dataInputs: Array<string>;
}

export { ErgoConfigs, ErgoTransactionJsonModel };
