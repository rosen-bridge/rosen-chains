import {
  AbstractEvmNetwork,
  EvmChain,
  EvmConfigs,
  TssSignFunction,
} from '@rosen-chains/evm';
import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { BNB, BINANCE_CHAIN } from './constants';

class BinanceChain extends EvmChain {
  CHAIN = BINANCE_CHAIN;
  NATIVE_TOKEN_ID = BNB;
  CHAIN_ID = 56n;

  constructor(
    network: AbstractEvmNetwork,
    configs: EvmConfigs,
    tokens: RosenTokens,
    supportedTokens: Array<string>,
    signFunction: TssSignFunction,
    logger?: AbstractLogger
  ) {
    super(
      network,
      configs,
      tokens,
      supportedTokens,
      signFunction,
      BINANCE_CHAIN,
      BNB,
      logger
    );
  }
}

export default BinanceChain;
