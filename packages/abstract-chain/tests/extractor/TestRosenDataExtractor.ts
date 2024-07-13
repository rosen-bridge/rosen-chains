import {
  AbstractRosenDataExtractor,
  RosenData,
} from '@rosen-bridge/rosen-extractor';

class TestRosenDataExtractor extends AbstractRosenDataExtractor<string> {
  readonly chain = 'test';
  constructor() {
    super('', { idKeys: {}, tokens: [] });
  }

  extractRawData = (tx: string): RosenData | undefined => {
    throw Error(`not mocked`);
  };
}

export default TestRosenDataExtractor;
