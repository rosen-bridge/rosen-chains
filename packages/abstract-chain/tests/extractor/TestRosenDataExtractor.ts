import {
  AbstractRosenDataExtractor,
  RosenData,
} from '@rosen-bridge/rosen-extractor';

export class TestRosenDataExtractor extends AbstractRosenDataExtractor<string> {
  get = (transaction: string): RosenData | undefined => {
    throw Error(`not mocked`);
  };
}
