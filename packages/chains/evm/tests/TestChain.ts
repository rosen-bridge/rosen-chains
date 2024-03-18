import { EvmChain } from '../lib';

class TestChain extends EvmChain {
  CHAIN = 'test';
  CHAIN_ID = 1n;
}

export default TestChain;
