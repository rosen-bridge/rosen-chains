import {
  AbstractEvmNetwork,
  EvmChain,
  EvmConfigs,
  TssSignFunction,
} from '@rosen-chains/evm';
import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractLogger } from '@rosen-bridge/abstract-logger';
import { ETH, ETHEREUM_CHAIN, ETHEREUM_CHAIN_ID } from './constants';

class EthereumChain extends EvmChain {
  CHAIN = ETHEREUM_CHAIN;
  NATIVE_TOKEN_ID = ETH;
  CHAIN_ID = ETHEREUM_CHAIN_ID;

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
      ETHEREUM_CHAIN,
      ETH,
      logger
    );
  }
}

export default EthereumChain;
