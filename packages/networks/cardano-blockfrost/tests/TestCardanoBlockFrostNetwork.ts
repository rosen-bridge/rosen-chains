import CardanoBlockFrostNetwork from '../lib/CardanoBlockFrostNetwork';

export class TestCardanoBlockFrostNetwork extends CardanoBlockFrostNetwork {
  getClient = () => this.client;
}
