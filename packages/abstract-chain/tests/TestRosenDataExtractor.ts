import {
  AbstractRosenDataExtractor,
  RosenData,
} from '@rosen-bridge/rosen-extractor';

class TestRosenDataExtractor extends AbstractRosenDataExtractor<string> {
  constructor() {
    super('', { idKeys: {}, tokens: [] });
  }

  get = (tx: string): RosenData | undefined => {
    throw Error(`not mocked`);
  };
}

export default TestRosenDataExtractor;
