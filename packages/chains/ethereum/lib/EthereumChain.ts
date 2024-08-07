import { EvmChain } from '@rosen-chains/evm';
import { ETH, ETHEREUM_CHAIN } from './constants';

class EthereumChain extends EvmChain {
  CHAIN = ETHEREUM_CHAIN;
  NATIVE_TOKEN_ID = ETH;
  CHAIN_ID = 1n;
}

export default EthereumChain;
