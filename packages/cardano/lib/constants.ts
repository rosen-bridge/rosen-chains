import {
  BigNum,
  LinearFee,
  TransactionBuilderConfig,
  TransactionBuilderConfigBuilder,
} from '@emurgo/cardano-serialization-lib-nodejs';

const protocolParameters = {
  minFeeA: BigNum.from_str('44'),
  minFeeB: BigNum.from_str('155381'),
  poolDeposit: BigNum.from_str('500000000'),
  keyDeposit: BigNum.from_str('2000000'),
  maxValueSize: 4000,
  maxTxSize: 8000,
  coinsPerUtxoWord: BigNum.from_str('34482'),
};

const linearFee = LinearFee.new(
  protocolParameters.minFeeA,
  protocolParameters.minFeeB
);

export const txBuilderConfig: TransactionBuilderConfig =
  TransactionBuilderConfigBuilder.new()
    .fee_algo(linearFee)
    .pool_deposit(protocolParameters.poolDeposit)
    .key_deposit(protocolParameters.keyDeposit)
    .max_value_size(protocolParameters.maxValueSize)
    .max_tx_size(protocolParameters.maxTxSize)
    .coins_per_utxo_word(protocolParameters.coinsPerUtxoWord)
    .build();
