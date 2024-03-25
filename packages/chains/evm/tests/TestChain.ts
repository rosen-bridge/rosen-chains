import { RosenTokens } from '@rosen-bridge/tokens';
import { AbstractEvmNetwork, EvmChain } from '../lib';
import { EvmRosenExtractor } from '@rosen-bridge/rosen-extractor';

class TestChain extends EvmChain {
  CHAIN = 'test';
  CHAIN_ID = 1n;
  extractor: EvmRosenExtractor;

  constructor(
    network: AbstractEvmNetwork,
    configs: any,
    feeRatioDivisor: bigint,
    tokens: RosenTokens,
    nativeToken: string,
    supportedTokens: Array<string>,
    signFunction: (txHash: Uint8Array) => Promise<string>,
    logger?: any
  ) {
    super(
      network,
      configs,
      feeRatioDivisor,
      tokens,
      nativeToken,
      supportedTokens,
      signFunction,
      logger
    );

    this.extractor = new EvmRosenExtractor(
      this.configs.addresses.lock,
      tokens,
      this.CHAIN,
      nativeToken,
      logger
    );
  }
}

export default TestChain;
