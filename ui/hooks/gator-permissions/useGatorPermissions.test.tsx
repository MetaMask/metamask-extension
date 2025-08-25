import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import { GatorPermissionsMap } from '@metamask/gator-permissions-controller';
import {
  enableGatorPermissions,
  fetchAndUpdateGatorPermissions,
} from '../../store/controller-actions/gator-permissions-controller';
import { forceUpdateMetamaskState } from '../../store/actions';
import { useGatorPermissions } from './useGatorPermissions';

jest.mock(
  '../../store/controller-actions/gator-permissions-controller',
  () => ({
    enableGatorPermissions: jest.fn(),
    fetchAndUpdateGatorPermissions: jest.fn(),
  }),
);

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const mockEnableGatorPermissions =
  enableGatorPermissions as jest.MockedFunction<typeof enableGatorPermissions>;
const mockFetchAndUpdateGatorPermissions =
  fetchAndUpdateGatorPermissions as jest.MockedFunction<
    typeof fetchAndUpdateGatorPermissions
  >;
const mockForceUpdateMetamaskState =
  forceUpdateMetamaskState as jest.MockedFunction<
    typeof forceUpdateMetamaskState
  >;

describe('useGatorPermissions', () => {
  let store: Store;

  const mockGatorPermissionsMap: GatorPermissionsMap = {
    'native-token-stream': {
      '0x1': [
        {
          permissionResponse: {
            chainId: '0x1',
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            permission: {
              type: 'native-token-stream',
              data: {
                maxAmount: '0x22b1c8c1227a0000',
                initialAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
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
            expiry: 1750291200,
            permission: {
              type: 'erc20-token-stream',
              data: {
                initialAmount: '0x22b1c8c1227a0000',
                maxAmount: '0x6f05b59d3b20000',
                amountPerSecond: '0x6f05b59d3b20000',
                startTime: 1747699200,
                tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
              },
              rules: {},
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
        gatorPermissionsMapSerialized: '',
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
    mockEnableGatorPermissions.mockResolvedValue(undefined);
    mockFetchAndUpdateGatorPermissions.mockResolvedValue(
      mockGatorPermissionsMap,
    );
    mockForceUpdateMetamaskState.mockResolvedValue(undefined);
  });

  it('should start with loading state and undefined data', () => {
    const { result } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should call enableGatorPermissions and fetchAndUpdateGatorPermissions on mount', async () => {
    await act(async () => {
      renderHook(() => useGatorPermissions(), {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      });
    });

    expect(mockEnableGatorPermissions).toHaveBeenCalledTimes(1);
    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
  });

  it('should update state with data when both operations succeed', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockGatorPermissionsMap);
    expect(result.current.error).toBeUndefined();
    expect(mockForceUpdateMetamaskState).toHaveBeenCalledWith(store.dispatch);
  });

  it('should handle error when enableGatorPermissions fails', async () => {
    const error = new Error('Enable permissions failed');
    mockEnableGatorPermissions.mockRejectedValue(error);

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
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(error);
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
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(error);
  });

  it('should not update state if component is unmounted during async operation', async () => {
    const { result, unmount } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    unmount();

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should handle non-Error objects thrown by the async operations', async () => {
    const nonErrorObject = { message: 'Not an Error object' };
    mockEnableGatorPermissions.mockRejectedValue(nonErrorObject);

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(nonErrorObject);
  });

  it('should handle undefined error objects', async () => {
    mockEnableGatorPermissions.mockRejectedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should handle null error objects', async () => {
    mockEnableGatorPermissions.mockRejectedValue(null);

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(null);
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

    expect(mockEnableGatorPermissions).toHaveBeenCalledTimes(1);
    expect(mockFetchAndUpdateGatorPermissions).toHaveBeenCalledTimes(1);
  });

  it('should handle empty GatorPermissionsMap', async () => {
    const emptyPermissionsList: GatorPermissionsMap = {
      'native-token-stream': {},
      'erc20-token-stream': {},
      'native-token-periodic': {},
      'erc20-token-periodic': {},
      other: {},
    };

    mockFetchAndUpdateGatorPermissions.mockResolvedValue(emptyPermissionsList);

    const { result, waitForNextUpdate } = renderHook(
      () => useGatorPermissions(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(emptyPermissionsList);
    expect(result.current.error).toBeUndefined();
  });

  it('should not set error if component is unmounted during error handling', async () => {
    const { result, unmount } = renderHook(() => useGatorPermissions(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    unmount();

    expect(result.current.error).toBeUndefined();
  });
});
