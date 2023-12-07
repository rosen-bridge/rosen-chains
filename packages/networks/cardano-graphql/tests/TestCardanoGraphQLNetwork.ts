import CardanoGraphQLNetwork from '../lib/CardanoGraphQLNetwork';

export class TestCardanoGraphQLNetwork extends CardanoGraphQLNetwork {
  getClient = () => this.client;
}
