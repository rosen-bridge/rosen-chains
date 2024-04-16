import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractEvmNetwork, EvmChain, TssSignFunction } from '../lib';
import { EvmRosenExtractor } from '@rosen-bridge/rosen-extractor';

class TestChain extends EvmChain {
  CHAIN = 'test';
  CHAIN_ID = 1n;
  extractor: EvmRosenExtractor;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    tokens: RosenTokens,
    nativeToken: string,
    supportedTokens: Array<string>,
    signFunction: TssSignFunction
  ) {
    super(network, configs, tokens, nativeToken, supportedTokens, signFunction);

    this.extractor = new EvmRosenExtractor(
      this.configs.addresses.lock,
      tokens,
      this.CHAIN,
      nativeToken
    );
  }
}

export default TestChain;
