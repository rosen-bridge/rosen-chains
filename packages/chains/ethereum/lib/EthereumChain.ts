import { RosenTokens } from '@rosen-bridge/tokens';
import {
  AbstractEvmNetwork,
  EvmChain,
  EvmConfigs,
  TssSignFunction,
} from '@rosen-chains/evm';

class EthereumChain extends EvmChain {
  CHAIN = 'ethereum';
  NATIVE_TOKEN_ID = 'eth';
  CHAIN_ID = 1n;

  constructor(
    network: AbstractEvmNetwork,
    configs: EvmConfigs,
    tokens: RosenTokens,
    supportedTokens: Array<string>,
    signFunction: TssSignFunction
  ) {
    super(network, configs, tokens, supportedTokens, signFunction);
  }
}

export default EthereumChain;
