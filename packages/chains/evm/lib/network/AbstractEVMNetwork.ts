import { AbstractChainNetwork } from '@rosen-chains/abstract-chain';
import EVMTransaction from '../EVMTransaction';

abstract class AbstractEVMNetwork extends AbstractChainNetwork<EVMTransaction> {}

export default AbstractEVMNetwork;
