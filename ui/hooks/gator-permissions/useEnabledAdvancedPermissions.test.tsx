import React from 'react';
import { Provider } from 'react-redux';
import { renderHook } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import type { Store } from 'redux';
import * as manifestFlags from '../../../shared/lib/manifestFlags';
import { captureMessage } from '../../../shared/lib/sentry';
import { ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG } from '../../../shared/lib/gator-permissions/feature-flags';
import { useEnabledAdvancedPermissions } from './useEnabledAdvancedPermissions';

jest.mock('../../../shared/lib/sentry', () => ({
  captureMessage: jest.fn(),
}));

const mockStore = configureStore([]);

const createStore = (remoteFeatureFlags: Record<string, unknown> = {}): Store =>
  mockStore({
    metamask: {
      remoteFeatureFlags,
    },
  });

const createWrapper =
  (store: Store) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

describe('useEnabledAdvancedPermissions', () => {
  let originalGatorEnabledPermissionTypes: string | undefined;
  let getManifestFlagsMock: jest.SpyInstance;

  const restoreGatorEnabledPermissionTypes = () => {
    if (originalGatorEnabledPermissionTypes === undefined) {
      delete process.env.GATOR_ENABLED_PERMISSION_TYPES;
      return;
    }

    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      originalGatorEnabledPermissionTypes;
  };

  beforeAll(() => {
    originalGatorEnabledPermissionTypes =
      process.env.GATOR_ENABLED_PERMISSION_TYPES;
  });

  beforeEach(() => {
    jest.mocked(captureMessage).mockClear();
    getManifestFlagsMock = jest
      .spyOn(manifestFlags, 'getManifestFlags')
      .mockReturnValue({});
  });

  afterEach(() => {
    getManifestFlagsMock.mockRestore();
    restoreGatorEnabledPermissionTypes();
  });

  it('returns permission types enabled by both build and remote flags', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES =
      'native-token-stream,erc20-token-stream';

    const store = createStore({
      [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
        permissions: ['native-token-stream', 'native-token-periodic'],
      },
      unrelatedRemoteFeatureFlag: true,
    });

    const { result } = renderHook(() => useEnabledAdvancedPermissions(), {
      wrapper: createWrapper(store),
    });

    expect(result.current).toStrictEqual(['native-token-stream']);
  });

  it('applies manifest flag overrides', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = 'native-token-stream';
    getManifestFlagsMock.mockReturnValue({
      remoteFeatureFlags: {
        [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
          permissions: ['native-token-stream'],
        },
      },
    });

    const store = createStore({
      [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
        permissions: [],
      },
    });

    const { result } = renderHook(() => useEnabledAdvancedPermissions(), {
      wrapper: createWrapper(store),
    });

    expect(result.current).toStrictEqual(['native-token-stream']);
  });

  it('returns an empty array when the remote flag is malformed', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = 'native-token-stream';

    const store = createStore({
      [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: true,
    });

    const { result } = renderHook(() => useEnabledAdvancedPermissions(), {
      wrapper: createWrapper(store),
    });

    expect(result.current).toStrictEqual([]);
    expect(captureMessage).toHaveBeenCalledWith(
      'Invalid enabledAdvancedPermissions remote feature flag',
      {
        level: 'warning',
        extra: {
          featureFlag: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
        },
      },
    );
  });

  it('reports malformed remote flags for each hook instance', () => {
    process.env.GATOR_ENABLED_PERMISSION_TYPES = 'native-token-stream';

    const store = createStore({
      [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: true,
    });

    renderHook(() => useEnabledAdvancedPermissions(), {
      wrapper: createWrapper(store),
    });
    expect(captureMessage).toHaveBeenCalledTimes(1);

    jest.mocked(captureMessage).mockClear();

    renderHook(() => useEnabledAdvancedPermissions(), {
      wrapper: createWrapper(store),
    });
    expect(captureMessage).toHaveBeenCalledTimes(1);
  });
});
