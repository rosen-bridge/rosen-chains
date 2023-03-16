import { AssetBalance, ChainUtils, ValueError } from '../lib';

describe('ChainUtils', () => {
  describe('isEqualAssetBalance', () => {
    /**
     * @target ChainUtils.isEqualAssetBalance should return true when assets are
     * equal
     * @dependencies
     * @scenario
     * - mock an AssetBalance
     * - run test
     * - check returned value
     * @expected
     * - it should return true
     */
    it('should return true when assets are equal', () => {
      // mock an AssetBalance
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b = structuredClone(a);

      // run test
      const result = ChainUtils.isEqualAssetBalance(a, b);

      // check returned value
      expect(result).toEqual(true);
    });

    /**
     * @target ChainUtils.isEqualAssetBalance should return false when
     * native token is NOT equal
     * @dependencies
     * @scenario
     * - mock two AssetBalance with different native token value
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when native token is NOT equal', () => {
      // mock two AssetBalance with different native token value
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b = structuredClone(a);
      b.nativeToken = 1n;

      // run test
      const result = ChainUtils.isEqualAssetBalance(a, b);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ChainUtils.isEqualAssetBalance should return false when a token
     * is missing in first object
     * @dependencies
     * @scenario
     * - mock two AssetBalance (second object has 1 more token)
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when a token is missing in first object', () => {
      // mock two AssetBalance (second object has 1 more token)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };

      // run test
      const result = ChainUtils.isEqualAssetBalance(a, b);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ChainUtils.isEqualAssetBalance should return false when a token
     * is missing in second object
     * @dependencies
     * @scenario
     * - mock two AssetBalance (first object has 1 more token)
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when a token is missing in second object', () => {
      // mock two AssetBalance (first object has 1 more token)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
        ],
      };

      // run test
      const result = ChainUtils.isEqualAssetBalance(a, b);

      // check returned value
      expect(result).toEqual(false);
    });

    /**
     * @target ChainUtils.isEqualAssetBalance should return false when a token
     * value is not equal
     * @dependencies
     * @scenario
     * - mock two AssetBalance with different token value
     * - run test
     * - check returned value
     * @expected
     * - it should return false
     */
    it('should return false when a token value is not equal', () => {
      // mock two AssetBalance with different token value
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b = structuredClone(a);
      b.tokens[1].value = 2n;

      // run test
      const result = ChainUtils.isEqualAssetBalance(a, b);

      // check returned value
      expect(result).toEqual(false);
    });
  });

  describe('sumAssetBalance', () => {
    /**
     * @target ChainUtils.sumAssetBalance should return aggregated assets
     * successfully
     * @dependencies
     * @scenario
     * - mock two AssetBalance
     * - run test
     * - check returned value
     * @expected
     * - it should return aggregated assets
     */
    it('should return aggregated assets successfully', () => {
      // mock two AssetBalance
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 200n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
          {
            id: 'id3',
            value: 30n,
          },
        ],
      };

      // run test
      const result = ChainUtils.sumAssetBalance(a, b);

      // check returned value
      expect(result).toEqual({
        nativeToken: 300n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
          {
            id: 'id3',
            value: 30n,
          },
        ],
      });
    });

    /**
     * @target ChainUtils.sumAssetBalance should NOT mitigate original objects
     * @dependencies
     * @scenario
     * - mock two AssetBalance
     * - run test
     * - check passed objects
     * @expected
     * - passed objects should be the same
     */
    it('should NOT mitigate original objects', () => {
      // mock two AssetBalance
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 200n,
        tokens: [
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };

      // run test
      ChainUtils.sumAssetBalance(a, b);

      // check passed objects
      expect(a).toEqual({
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
        ],
      });
      expect(b).toEqual({
        nativeToken: 200n,
        tokens: [
          {
            id: 'id2',
            value: 20n,
          },
        ],
      });
    });
  });

  describe('reduceAssetBalance', () => {
    /**
     * @target ChainUtils.reduceAssetBalance should return remaining assets
     * successfully
     * @dependencies
     * @scenario
     * - mock two AssetBalance
     * - run test
     * - check returned value
     * @expected
     * - it should return aggregated assets
     */
    it('should return remaining assets successfully', () => {
      // mock two AssetBalance
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 50n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
        ],
      };

      // run test
      const result = ChainUtils.reduceAssetBalance(a, b);

      // check returned value
      expect(result).toEqual({
        nativeToken: 50n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
          {
            id: 'id2',
            value: 20n,
          },
        ],
      });
    });

    /**
     * @target ChainUtils.reduceAssetBalance should throw exception when
     * native token is not enough
     * @dependencies
     * @scenario
     * - mock two AssetBalance (second object has more native token)
     * - run test & check thrown exception
     * @expected
     * - it should return aggregated assets
     */
    it('should throw exception when native token is not enough', () => {
      // mock two AssetBalance (second object has more native token)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [],
      };
      const b: AssetBalance = {
        nativeToken: 500n,
        tokens: [],
      };

      // run test & check thrown exception
      expect(() => {
        ChainUtils.reduceAssetBalance(a, b);
      }).toThrow(ValueError);
    });

    /**
     * @target ChainUtils.reduceAssetBalance should throw exception when
     * a token is not enough
     * @dependencies
     * @scenario
     * - mock two AssetBalance (second object has more value for a token)
     * - run test & check thrown exception
     * @expected
     * - it should return aggregated assets
     */
    it('should throw exception when a token value is not enough', () => {
      // mock two AssetBalance (second object has more value for a token)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 5n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 50n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
        ],
      };

      // run test & check thrown exception
      expect(() => {
        ChainUtils.reduceAssetBalance(a, b);
      }).toThrow(ValueError);
    });

    /**
     * @target ChainUtils.reduceAssetBalance should throw exception when
     * a token is missing
     * @dependencies
     * @scenario
     * - mock two AssetBalance (second object has a token is missing in first object)
     * - run test & check thrown exception
     * @expected
     * - it should return aggregated assets
     */
    it('should throw exception when native token is missing', () => {
      // mock two AssetBalance (second object has a token is missing in first object)
      const a: AssetBalance = {
        nativeToken: 100n,
        tokens: [
          {
            id: 'id1',
            value: 50n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 50n,
        tokens: [
          {
            id: 'id1',
            value: 10n,
          },
          {
            id: 'id2',
            value: 10n,
          },
        ],
      };

      // run test & check thrown exception
      expect(() => {
        ChainUtils.reduceAssetBalance(a, b);
      }).toThrow(ValueError);
    });

    /**
     * @target ChainUtils.reduceAssetBalance should NOT mitigate original objects
     * @dependencies
     * @scenario
     * - mock two AssetBalance
     * - run test
     * - check passed objects
     * @expected
     * - passed objects should be the same
     */
    it('should NOT mitigate original objects', () => {
      // mock two AssetBalance
      const a: AssetBalance = {
        nativeToken: 300n,
        tokens: [
          {
            id: 'id1',
            value: 50n,
          },
        ],
      };
      const b: AssetBalance = {
        nativeToken: 200n,
        tokens: [
          {
            id: 'id1',
            value: 20n,
          },
        ],
      };

      // run test
      ChainUtils.reduceAssetBalance(a, b);

      // check passed objects
      expect(a).toEqual({
        nativeToken: 300n,
        tokens: [
          {
            id: 'id1',
            value: 50n,
          },
        ],
      });
      expect(b).toEqual({
        nativeToken: 200n,
        tokens: [
          {
            id: 'id1',
            value: 20n,
          },
        ],
      });
    });
  });
});
