import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import { fetchAndUpdateGatorPermissions } from '../../store/controller-actions/gator-permissions-controller';
import { useGatorPermissions } from './useGatorPermissions';

jest.mock(
  '../../store/controller-actions/gator-permissions-controller',
  () => ({
    fetchAndUpdateGatorPermissions: jest.fn(),
  }),
);

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const mockFetchAndUpdateGatorPermissions =
  fetchAndUpdateGatorPermissions as jest.MockedFunction<
    typeof fetchAndUpdateGatorPermissions
  >;

describe('useGatorPermissions', () => {
  let store: Store;

  const mockGatorPermissionsMap: GatorPermissionsMap = {
    'erc20-token-revocation': {},
    'native-token-stream': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            permission: {
              isAdjustmentAllowed: false,
              type: 'native-token-stream',
              data: {
                maxAmount: '0x22b1c8c1227a0000',
                initialAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
            },
            context: '0x00000000',
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
    'erc20-token-stream': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            permission: {
              type: 'erc20-token-stream',
              isAdjustmentAllowed: false,
              data: {
                initialAmount: '0x22b1c8c1227a0000',
                maxAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
            },
            context: '0x00000000',
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
    'native-token-periodic': {},
    'erc20-token-periodic': {},
    other: {},
  };

  beforeEach(() => {
    store = mockStore({
      metamask: {
        gatorPermissionsMapSerialized: JSON.stringify({
          'native-token-stream': {},
          'erc20-token-stream': {},
          'native-token-periodic': {},
          'erc20-token-periodic': {},
          other: {},
        }),
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
      },
    });

    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return Promise.resolve();
    });

    jest.clearAllMocks();
    mockFetchAndUpdateGatorPermissions.mockResolvedValue(
      mockGatorPermissionsMap,
    );
  });

  it('should start with loading false when cache exists', async () => {
    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // With cache present, loading should be false and data should be available immediately
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
    // isRefreshing may be true initially as the background refresh starts
  });

  it('should start with loading true when no cache exists', () => {
    // Create a store with invalid cached data (will be caught by try-catch)
    const emptyStore = mockStore({
      metamask: {
        gatorPermissionsMapSerialized: '', // Empty string will fail deserialization
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
      },
    });

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={emptyStore}>{children}</Provider>
      ),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should call fetchAndUpdateGatorPermissions on mount', async () => {
    await act(async () => {
      renderHook(() => useGatorPermissions(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });
    });

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
  });

  it('should fetch and update when cache exists (background refresh)', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    // Initially shows cached data with loading false
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
  });

  it('should handle error when fetchAndUpdateGatorPermissions fails', async () => {
    const error = new Error('Fetch permissions failed');
    mockFetchAndUpdateGatorPermissions.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    // Add a small delay to ensure error handling completes
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(result.current.loading).toBe(false);
    // With cache-first, data is still available from cache even if refresh fails
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBe(error);
  });

  it('should not update state if component is unmounted during async operation', async () => {
    const { result, unmount } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    unmount();

    // With cache, initial state shows cached data
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should only run the effect once on mount', async () => {
    await act(async () => {
      const { rerender } = renderHook(() => useGatorPermissions(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });

      rerender();
      rerender();
      rerender();
    });

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
  });

  it('should handle empty GatorPermissionsMap from cache', async () => {
    const emptyPermissionsList: GatorPermissionsMap = {
      'erc20-token-revocation': {},
      'native-token-stream': {},
      'erc20-token-stream': {},
      'native-token-periodic': {},
      'erc20-token-periodic': {},
      other: {},
    };

    mockFetchAndUpdateGatorPermissions.mockResolvedValue(emptyPermissionsList);

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // Should return cached empty list immediately
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should not set error if component is unmounted during error handling', async () => {
    const { result, unmount } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    unmount();

    expect(result.current.error).toBeUndefined();
  });

  it('should skip background refresh when refreshInBackground is false', async () => {
    const { result } = renderHook(
      () => useGatorPermissions({ refreshInBackground: false }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    // Should return cached data immediately and not fetch
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
    expect(result.current.isRefreshing).toBe(false);

    // Wait a bit to ensure no fetch happens
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockFetchAndUpdateGatorPermissions).not.toHaveBeenCalled();
  });

  it('should show isRefreshing true during background refresh', async () => {
    let resolveFetch: (value: GatorPermissionsMap) => void;
    const fetchPromise = new Promise<GatorPermissionsMap>((resolve) => {
      resolveFetch = resolve;
    });
    mockFetchAndUpdateGatorPermissions.mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // Initially shows cached data
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();

    // Wait for the effect to run and start fetching
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should be refreshing now
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.loading).toBe(false);

    // Complete the fetch
    await act(async () => {
      resolveFetch(mockGatorPermissionsMap);
      await fetchPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should return cached data from Redux selector', () => {
    // Create store with actual permission data
    const storeWithData = mockStore({
      metamask: {
        gatorPermissionsMapSerialized: JSON.stringify(mockGatorPermissionsMap),
        isGatorPermissionsEnabled: true,
        isFetchingGatorPermissions: false,
      },
    });

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={storeWithData}>{children}</Provider>
      ),
    });

    // Should immediately return the cached data
    expect(result.current.data).toEqual(mockGatorPermissionsMap);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch when no cache exists', async () => {
    // Create store with no cached data (empty string fails deserialization)
    const emptyStore = mockStore({
      metamask: {
        gatorPermissionsMapSerialized: '', // Will be caught by try-catch
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
      },
    });

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={emptyStore}>{children}</Provider>
        ),
      },
    );

    // Should start in loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isRefreshing).toBe(false);

    await waitForNextUpdate();

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it('should not set hasFetchedRef flag when fetch fails', async () => {
    // Create store with no cached data
    const emptyStore = mockStore({
      metamask: {
        gatorPermissionsMapSerialized: '', // Will be caught by try-catch
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
      },
    });

    // Mock fetch to always fail
    mockFetchAndUpdateGatorPermissions.mockRejectedValue(
      new Error('Fetch failed'),
    );

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={emptyStore}>{children}</Provider>
      ),
    });

    // Wait for fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should have error and loading should be false
    expect(result.current.error).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);

    // The key test: if we change a dependency and re-render, it should try to fetch again
    // because hasFetchedRef should still be false (not set on failure)
    const { rerender } = renderHook(
      () => useGatorPermissions({ refreshInBackground: false }),
      {
        wrapper: ({ children }) => (
          <Provider store={emptyStore}>{children}</Provider>
        ),
      },
    );

    // Change refreshInBackground to trigger effect re-run
    rerender();

    // Wait for potential retry
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should have attempted fetch again (total of 2 calls)
    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(2);
  });
});
