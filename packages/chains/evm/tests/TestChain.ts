import { EvmChain } from '../lib';

class TestChain extends EvmChain {
  CHAIN_NAME = 'test';
  CHAIN_ID = 1n;
}

export default TestChain;
