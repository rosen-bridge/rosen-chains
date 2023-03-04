import TestUtxoChainNetwork from './TestUtxoChainNetwork';
import spyOn = jest.spyOn;
import TestUtxoChain from './TestUtxoChain';
import { AssetBalance } from '../../lib/abstract/Interfaces';

describe('AbstractUtxoChain', () => {
  describe('getCoveringBoxes', () => {
    const emptyMap = new Map<string, string>();

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return enough boxes
     *  with covered key when boxes cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets less than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return enough boxes with covered key when boxes cover required assets', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });

      // Mock an AssetBalance object with assets less than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 50000n,
        tokens: [{ id: 'token1', value: 100n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(true);
      expect(result.boxes).toEqual(['serialized-box-1']);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return all boxes with
     *  NOT covered key when boxes do NOT cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets more than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return all boxes with NOT covered key when boxes do NOT cover required assets', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });

      // Mock an AssetBalance object with assets more than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 300000n,
        tokens: [{ id: 'token1', value: 100n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(false);
      expect(result.boxes).toEqual(['serialized-box-1', 'serialized-box-2']);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return all useful boxes
     *  with NOT covered key when boxes do NOT cover required tokens
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *      (second box doesn't contain required token)
     *    Mock an AssetBalance object with tokens more than box tokens
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return all useful boxes with NOT covered key when boxes do NOT cover required tokens', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      //  (second box doesn't contain required token)
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token2', value: 200n }],
          },
        });

      // Mock an AssetBalance object with tokens more than box tokens
      const requiredAssets: AssetBalance = {
        nativeToken: 60000n,
        tokens: [{ id: 'token1', value: 300n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(false);
      expect(result.boxes).toEqual(['serialized-box-1']);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return enough boxes
     *  with covered key when two pages boxes cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 12 boxes
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets less than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return enough boxes with covered key when two pages boxes cover required assets', async () => {
      // Mock a network object to return 12 boxes
      const network = new TestUtxoChainNetwork();
      const networkSpy = spyOn(network, 'getAddressBoxes');
      networkSpy.mockResolvedValue([]);
      networkSpy.mockResolvedValueOnce(
        Array.from({ length: 10 }, (x, i) => i).map(
          (i) => `serialized-box-${i + 1}`
        )
      );
      networkSpy.mockResolvedValueOnce([
        'serialized-box-11',
        'serialized-box-12',
      ]);

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      const chainSpy = spyOn(chain, 'getBoxInfo');
      Array.from({ length: 12 }, (x, i) => i).map((i) => {
        chainSpy.mockReturnValueOnce({
          id: `box${i + 1}`,
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });
      });

      // Mock an AssetBalance object with assets less than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 1100000n,
        tokens: [{ id: 'token1', value: 900n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(true);
      expect(result.boxes).toEqual(
        Array.from({ length: 11 }, (x, i) => i).map(
          (i) => `serialized-box-${i + 1}`
        )
      );
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return all boxes with
     *  NOT covered key when two pages boxes do NOT cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 12 boxes
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets more than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return all boxes with NOT covered key when two pages boxes do NOT cover required assets', async () => {
      // Mock a network object to return 12 boxes
      const network = new TestUtxoChainNetwork();
      const networkSpy = spyOn(network, 'getAddressBoxes');
      networkSpy.mockResolvedValue([]);
      networkSpy.mockResolvedValueOnce(
        Array.from({ length: 10 }, (x, i) => i).map(
          (i) => `serialized-box-${i + 1}`
        )
      );
      networkSpy.mockResolvedValueOnce([
        'serialized-box-11',
        'serialized-box-12',
      ]);

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      const chainSpy = spyOn(chain, 'getBoxInfo');
      Array.from({ length: 12 }, (x, i) => i).map((i) => {
        chainSpy.mockReturnValueOnce({
          id: `box${i + 1}`,
          assets: { nativeToken: 100000n, tokens: [] },
        });
      });

      // Mock an AssetBalance object with assets more than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 1300000n,
        tokens: [],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(false);
      expect(result.boxes).toEqual(
        Array.from({ length: 12 }, (x, i) => i).map(
          (i) => `serialized-box-${i + 1}`
        )
      );
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return no boxes with
     *  NOT covered key when address has no boxes
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return NO boxes
     *    Mock an AssetBalance object with some assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return no boxes with NOT covered key when address has no boxes', async () => {
      // Mock a network object to return NO boxes
      const network = new TestUtxoChainNetwork();
      const networkSpy = spyOn(network, 'getAddressBoxes');
      networkSpy.mockResolvedValue([]);

      // Mock an AssetBalance object with some assets
      const requiredAssets: AssetBalance = {
        nativeToken: 100000n,
        tokens: [{ id: 'token1', value: 900n }],
      };

      // Run test
      const chain = new TestUtxoChain(network);
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(false);
      expect(result.boxes).toEqual([]);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return enough boxes
     *  with covered key when tracked boxes cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock a Map to track first box to a new box
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets less than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return enough boxes with covered key when tracked boxes cover required assets', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock a Map to track first box to a new box
      const trackMap = new Map<string, string>();
      trackMap.set('box1', 'serialized-tracked-box-1');

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'trackedBox1',
          assets: {
            nativeToken: 80000n,
            tokens: [{ id: 'token1', value: 150n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });

      // Mock an AssetBalance object with assets less than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 50000n,
        tokens: [{ id: 'token1', value: 100n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        trackMap
      );

      // Check returned value
      expect(result.covered).toEqual(true);
      expect(result.boxes).toEqual(['serialized-tracked-box-1']);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return all boxes with
     *  NOT covered key when tracked boxes does NOT cover required assets
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock a Map to track first box to a new box
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets more than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return all boxes with NOT covered key when tracked boxes does NOT cover required assets', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock a Map to track first box to a new box
      const trackMap = new Map<string, string>();
      trackMap.set('box1', 'serialized-tracked-box-1');

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'trackedBox1',
          assets: {
            nativeToken: 80000n,
            tokens: [{ id: 'token1', value: 150n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });

      // Mock an AssetBalance object with assets less than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 190000n,
        tokens: [{ id: 'token1', value: 390n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        [],
        trackMap
      );

      // Check returned value
      expect(result.covered).toEqual(false);
      expect(result.boxes).toEqual([
        'serialized-tracked-box-1',
        'serialized-box-2',
      ]);
    });

    /**
     * Target: AbstractUtxoChain.getCoveringBoxes should return second box
     *  with covered key when first box is not allowed
     * Dependencies:
     *    -
     * Scenario:
     *    Mock a network object to return 2 boxes
     *    Mock first box as unallowable
     *    Mock chain 'getBoxInfo' function to return mocked boxes assets
     *    Mock an AssetBalance object with assets less than box assets
     *    Run test
     *    Check returned value
     * Expected Output:
     *    It should return the correct value
     */
    it('should return second box with covered key when first box is not allowed', async () => {
      // Mock a network object to return 2 boxes
      const network = new TestUtxoChainNetwork();
      spyOn(network, 'getAddressBoxes')
        .mockResolvedValue([])
        .mockResolvedValueOnce(['serialized-box-1', 'serialized-box-2']);

      // Mock first box as unallowable
      const unallowableIds = ['box1'];

      // Mock chain 'getBoxInfo' function to return mocked boxes assets
      const chain = new TestUtxoChain(network);
      spyOn(chain, 'getBoxInfo')
        .mockReturnValueOnce({
          id: 'box1',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        })
        .mockReturnValueOnce({
          id: 'box2',
          assets: {
            nativeToken: 100000n,
            tokens: [{ id: 'token1', value: 200n }],
          },
        });

      // Mock an AssetBalance object with assets less than box assets
      const requiredAssets: AssetBalance = {
        nativeToken: 90000n,
        tokens: [{ id: 'token1', value: 190n }],
      };

      // Run test
      const result = await chain.getCoveringBoxes(
        '',
        requiredAssets,
        unallowableIds,
        emptyMap
      );

      // Check returned value
      expect(result.covered).toEqual(true);
      expect(result.boxes).toEqual(['serialized-box-2']);
    });
  });
});
