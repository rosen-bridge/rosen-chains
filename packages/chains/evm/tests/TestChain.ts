import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractEvmNetwork, EvmChain, TssSignFunction } from '../lib';
import { EvmRosenExtractor } from '@rosen-bridge/rosen-extractor';

class TestChain extends EvmChain {
  CHAIN = 'test';
  NATIVE_TOKEN_ID = 'test-native-token';
  CHAIN_ID = 1n;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    tokens: RosenTokens,
    supportedTokens: Array<string>,
    signFunction: TssSignFunction
  ) {
    super(network, configs, tokens, supportedTokens, signFunction);
  }
}

export default TestChain;
