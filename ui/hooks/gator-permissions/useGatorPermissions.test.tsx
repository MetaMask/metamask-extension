import React from 'react';
import { Provider } from 'react-redux';
import { waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import type { PermissionInfoWithMetadata } from '@metamask/gator-permissions-controller';
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

const createStoreWithCache = (
  permissions: PermissionInfoWithMetadata[] = [
    {
      permissionResponse: {
        chainId: '0x1',
        from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: false,
          data: { amountPerSecond: '0x0' },
        },
        context: '0x00000000',
        delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
      },
      siteOrigin: 'http://localhost:8000',
    },
  ],
) =>
  mockStore({
    metamask: {
      grantedPermissions: permissions,
      isFetchingGatorPermissions: false,
      pendingRevocations: [],
    },
  });

const createStoreWithNoCache = () =>
  mockStore({
    metamask: {
      grantedPermissions: [],
      isFetchingGatorPermissions: false,
      pendingRevocations: [],
    },
  });

describe('useGatorPermissions', () => {
  let store: Store;

  beforeEach(() => {
    store = createStoreWithNoCache();

    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return Promise.resolve();
    });

    jest.clearAllMocks();
    mockFetchAndUpdateGatorPermissions.mockResolvedValue(undefined);
  });

  it('should start with loading false when cache exists', async () => {
    const storeWithCache = createStoreWithCache();

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={storeWithCache}>{children}</Provider>
      ),
    });

    expect(result.current.loading).toBe(false);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should start with loading true when no cache exists', async () => {
    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should call fetchAndUpdateGatorPermissions on mount', async () => {
    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should fetch when cache exists (background refresh)', async () => {
    const storeWithCache = createStoreWithCache();

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={storeWithCache}>{children}</Provider>
      ),
    });

    expect(result.current.loading).toBe(false);

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should set loading to false when fetch fails', async () => {
    mockFetchAndUpdateGatorPermissions.mockRejectedValue(
      new Error('Fetch permissions failed'),
    );

    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should not update state if component is unmounted during async operation', () => {
    const storeWithCache = createStoreWithCache();

    const { result, unmount } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => (
        <Provider store={storeWithCache}>{children}</Provider>
      ),
    });

    unmount();

    expect(result.current.loading).toBe(false);
  });

  it('should only run the effect once on mount', async () => {
    const { result, rerender } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    await act(async () => {
      rerender();
      rerender();
      rerender();
    });

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should start with loading true when grantedPermissions is empty', async () => {
    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('should skip background refresh when refreshInBackground is false', async () => {
    const storeWithCache = createStoreWithCache();

    const { result } = renderHook(
      () => useGatorPermissions({ refreshInBackground: false }),
      {
        wrapper: ({ children }) => (
          <Provider store={storeWithCache}>{children}</Provider>
        ),
      },
    );

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockFetchAndUpdateGatorPermissions).not.toHaveBeenCalled();
  });

  it('should fetch when no cache exists', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it('should retry fetch when previous fetch failed', async () => {
    mockFetchAndUpdateGatorPermissions.mockRejectedValue(
      new Error('Fetch failed'),
    );

    const { result } = renderHook(
      () => useGatorPermissions({ refreshInBackground: false }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);

    const { result: result2, rerender } = renderHook(
      () => useGatorPermissions({ refreshInBackground: false }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    rerender();

    await waitFor(() => expect(result2.current.loading).toBe(false));

    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(2);
  });
});
