import { AbstractRosenDataExtractor } from '@rosen-bridge/rosen-extractor';

class TestRosenDataExtractor extends AbstractRosenDataExtractor<string> {
  constructor() {
    super('', { idKeys: {}, tokens: [] });
  }

  notImplemented = () => {
    throw Error('Not implemented');
  };

  get = this.notImplemented;
}

export default TestRosenDataExtractor;
