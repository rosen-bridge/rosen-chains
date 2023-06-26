import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

const CARDANO_CHAIN = 'cardano';
const ADA = 'ada';

const protocolParameters = {
  minFeeA: CardanoWasm.BigNum.from_str('44'),
  minFeeB: CardanoWasm.BigNum.from_str('155381'),
  poolDeposit: CardanoWasm.BigNum.from_str('500000000'),
  keyDeposit: CardanoWasm.BigNum.from_str('2000000'),
  maxValueSize: 4000,
  maxTxSize: 8000,
  coinsPerUtxoWord: CardanoWasm.BigNum.from_str('34482'),
};

const linearFee = CardanoWasm.LinearFee.new(
  protocolParameters.minFeeA,
  protocolParameters.minFeeB
);

const txBuilderConfig: CardanoWasm.TransactionBuilderConfig =
  CardanoWasm.TransactionBuilderConfigBuilder.new()
    .fee_algo(linearFee)
    .pool_deposit(protocolParameters.poolDeposit)
    .key_deposit(protocolParameters.keyDeposit)
    .max_value_size(protocolParameters.maxValueSize)
    .max_tx_size(protocolParameters.maxTxSize)
    .coins_per_utxo_word(protocolParameters.coinsPerUtxoWord)
    .build();

export { txBuilderConfig, CARDANO_CHAIN, ADA };
