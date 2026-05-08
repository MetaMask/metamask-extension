import { renderHook } from '@testing-library/react-hooks';
import type { CaipChainId } from '@metamask/utils';
import { useInitialStateFromLocation } from './useInitialStateFromLocation';

const MAINNET = 'eip155:1' as CaipChainId;
const BASE = 'eip155:8453' as CaipChainId;
const ARBITRUM = 'eip155:42161' as CaipChainId;

// Overridden per test to control useLocation().state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockLocationState: any = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: mockLocationState }),
}));

const noAssets = jest.fn((_chainId: CaipChainId | null) => [] as string[]);

describe('useInitialStateFromLocation', () => {
  beforeEach(() => {
    mockLocationState = null;
    noAssets.mockReset();
    noAssets.mockReturnValue([]);
  });

  describe('network selection', () => {
    it('falls back to the first available chain when location state is null', () => {
      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET, BASE], noAssets),
      );

      expect(result.current.networkChainId).toBe(MAINNET);
    });

    it('returns null networkChainId when there are no available networks', () => {
      const { result } = renderHook(() =>
        useInitialStateFromLocation([], noAssets),
      );

      expect(result.current.networkChainId).toBeNull();
    });

    it('restores the chain from location state when it is in the available list', () => {
      mockLocationState = { selectedNetworkChainId: BASE };

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET, BASE, ARBITRUM], noAssets),
      );

      expect(result.current.networkChainId).toBe(BASE);
    });

    it('falls back to the first chain when the stored chain is not in the available list', () => {
      mockLocationState = { selectedNetworkChainId: ARBITRUM };

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET, BASE], noAssets),
      );

      expect(result.current.networkChainId).toBe(MAINNET);
    });
  });

  describe('asset selection', () => {
    it('returns empty assetsId when location state is null', () => {
      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET], noAssets),
      );

      expect(result.current.assetsId).toStrictEqual([]);
    });

    it('returns empty assetsId when no selectedAssetsId in location state', () => {
      mockLocationState = { selectedNetworkChainId: MAINNET };

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET], noAssets),
      );

      expect(result.current.assetsId).toStrictEqual([]);
    });

    it('returns empty assetsId when selectedAssetsId is an empty array', () => {
      mockLocationState = {
        selectedNetworkChainId: MAINNET,
        selectedAssetsId: [],
      };

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET], noAssets),
      );

      expect(result.current.assetsId).toStrictEqual([]);
    });

    it('restores only assets that are still available on the resolved chain', () => {
      mockLocationState = {
        selectedNetworkChainId: MAINNET,
        selectedAssetsId: ['asset-a', 'asset-b', 'stale-asset'],
      };
      const getAvailableAssetIds = jest
        .fn()
        .mockReturnValue(['asset-a', 'asset-b', 'asset-c']);

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET], getAvailableAssetIds),
      );

      expect(result.current.assetsId).toStrictEqual(['asset-a', 'asset-b']);
    });

    it('returns empty assetsId when none of the stored assets are available', () => {
      mockLocationState = {
        selectedNetworkChainId: MAINNET,
        selectedAssetsId: ['stale-1', 'stale-2'],
      };
      const getAvailableAssetIds = jest
        .fn()
        .mockReturnValue(['asset-a', 'asset-b']);

      const { result } = renderHook(() =>
        useInitialStateFromLocation([MAINNET], getAvailableAssetIds),
      );

      expect(result.current.assetsId).toStrictEqual([]);
    });

    it('calls getAvailableAssetIds with the resolved networkChainId', () => {
      mockLocationState = {
        selectedNetworkChainId: BASE,
        selectedAssetsId: ['asset-x'],
      };
      const getAvailableAssetIds = jest.fn().mockReturnValue(['asset-x']);

      renderHook(() =>
        useInitialStateFromLocation([MAINNET, BASE], getAvailableAssetIds),
      );

      expect(getAvailableAssetIds).toHaveBeenCalledWith(BASE);
    });

    it('does not call getAvailableAssetIds when the network was not restored from state', () => {
      // selectedNetworkChainId absent → network not restored → skip asset lookup
      mockLocationState = { selectedAssetsId: ['asset-x'] };
      const getAvailableAssetIds = jest.fn().mockReturnValue(['asset-x']);

      renderHook(() =>
        useInitialStateFromLocation([MAINNET], getAvailableAssetIds),
      );

      expect(getAvailableAssetIds).not.toHaveBeenCalled();
    });
  });

  it('runs only once (empty dependency array) – result is stable across re-renders', () => {
    mockLocationState = {
      selectedNetworkChainId: MAINNET,
      selectedAssetsId: ['asset-a'],
    };
    const getAvailableAssetIds = jest.fn().mockReturnValue(['asset-a']);

    const { result, rerender } = renderHook(() =>
      useInitialStateFromLocation([MAINNET, BASE], getAvailableAssetIds),
    );

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
    // getAvailableAssetIds is only called on the initial render
    expect(getAvailableAssetIds).toHaveBeenCalledTimes(1);
  });
});
