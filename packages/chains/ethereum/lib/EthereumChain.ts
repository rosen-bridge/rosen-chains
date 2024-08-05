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
}

export default EthereumChain;
