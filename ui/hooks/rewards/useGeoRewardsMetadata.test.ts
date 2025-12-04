import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { RewardsGeoMetadata } from '../../../shared/types/rewards';
import { useGeoRewardsMetadata } from './useGeoRewardsMetadata';

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  getRewardsGeoMetadata: jest.fn(() => async () => null),
}));

const { getRewardsGeoMetadata } = jest.requireMock('../../store/actions') as {
  getRewardsGeoMetadata: jest.Mock;
};

// Helper to assert store is defined and returns a typed slice
type RewardsSliceForTest = {
  geoLocation: string | null;
  optinAllowedForGeo: boolean | null;
  optinAllowedForGeoLoading: boolean;
  optinAllowedForGeoError: boolean;
};

const getRewardsSlice = (store: unknown): RewardsSliceForTest => {
  const typed = store as {
    getState: () => { rewards: RewardsSliceForTest };
  };
  if (!typed || typeof typed.getState !== 'function') {
    throw new Error('Store is undefined');
  }
  return typed.getState().rewards;
};

describe('useGeoRewardsMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('exposes fetch function and state starts unchanged', () => {
      const { result, store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: false }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      expect(typeof result.current.fetchGeoRewardsMetadata).toBe('function');
      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.geoLocation).toBeNull();
      expect(rewardsState.optinAllowedForGeo).toBeNull();
      expect(rewardsState.optinAllowedForGeoError).toBe(false);
      expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
    });
  });

  describe('Conditional fetching via useEffect', () => {
    it('fetches and updates state when enabled', async () => {
      const mockMetadata: RewardsGeoMetadata = {
        geoLocation: 'US',
        optinAllowedForGeo: true,
      };

      (getRewardsGeoMetadata as jest.Mock).mockImplementation(
        () => async () => mockMetadata,
      );

      const { store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: true }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      await waitFor(() => {
        // Action should be called by useEffect
        expect(getRewardsGeoMetadata).toHaveBeenCalled();
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
        expect(rewardsState.optinAllowedForGeoError).toBe(false);
        expect(rewardsState.geoLocation).toBe('US');
        expect(rewardsState.optinAllowedForGeo).toBe(true);
      });
    });

    it('sets loading=true during fetch then false after resolve', async () => {
      let resolveMetadata!: (value: RewardsGeoMetadata | null) => void;
      (getRewardsGeoMetadata as jest.Mock).mockImplementation(
        () => async () =>
          new Promise<RewardsGeoMetadata | null>((resolve) => {
            resolveMetadata = resolve;
          }),
      );

      const { store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: true }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      // Loading should be true while fetch is in-flight
      await waitFor(() => {
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(true);
      });

      // Resolve mocked action
      act(() => {
        resolveMetadata({ geoLocation: 'CA-ON', optinAllowedForGeo: true });
      });

      // After resolution, loading returns to false and metadata updates
      await waitFor(() => {
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
        expect(rewardsState.geoLocation).toBe('CA-ON');
        expect(rewardsState.optinAllowedForGeo).toBe(true);
        expect(rewardsState.optinAllowedForGeoError).toBe(false);
      });
    });

    it('does not call action and resets when disabled', async () => {
      const { store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: false }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      // Enabled=false: hook dispatches reset state on mount and does not call action
      await waitFor(() => {
        expect(getRewardsGeoMetadata).not.toHaveBeenCalled();
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.geoLocation).toBeNull();
        expect(rewardsState.optinAllowedForGeo).toBeNull();
        expect(rewardsState.optinAllowedForGeoError).toBe(false);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
      });
    });
  });

  describe('fetchGeoRewardsMetadata function', () => {
    it('updates state when action resolves (without disabled auto-effect)', async () => {
      (getRewardsGeoMetadata as jest.Mock).mockImplementation(
        () => async () => ({ geoLocation: 'UK', optinAllowedForGeo: false }),
      );

      const { result, store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: true }),
        {
          metamask: {
            isUnlocked: false, // no effect on this hook, but keeps parity with other tests
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      await act(async () => {
        await result.current.fetchGeoRewardsMetadata();
      });

      expect(getRewardsGeoMetadata).toHaveBeenCalled();
      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
      expect(rewardsState.geoLocation).toBe('UK');
      expect(rewardsState.optinAllowedForGeo).toBe(false);
      expect(rewardsState.optinAllowedForGeoError).toBe(false);
    });

    it('sets error=true when action throws', async () => {
      const mockError = new Error('Network Error');
      (getRewardsGeoMetadata as jest.Mock).mockImplementation(
        () => async () => {
          throw mockError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: true }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      await act(async () => {
        await result.current.fetchGeoRewardsMetadata();
      });

      expect(getRewardsGeoMetadata).toHaveBeenCalled();
      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
      expect(rewardsState.optinAllowedForGeoError).toBe(true);
    });

    it('prevents duplicate calls while loading', async () => {
      let resolveMetadata!: (value: RewardsGeoMetadata | null) => void;
      (getRewardsGeoMetadata as jest.Mock).mockImplementation(
        () => async () =>
          new Promise<RewardsGeoMetadata | null>((resolve) => {
            resolveMetadata = resolve;
          }),
      );

      const { result, store } = renderHookWithProvider(
        () => useGeoRewardsMetadata({ enabled: true }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
          },
        },
      );

      // Trigger a manual fetch while auto-effect fetch is in-flight
      act(() => {
        result.current.fetchGeoRewardsMetadata();
      });

      // Ensure only a single call was made to the action while loading
      await waitFor(() => {
        expect(getRewardsGeoMetadata).toHaveBeenCalledTimes(1);
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(true);
      });

      // Resolve the first (in-flight) request
      act(() => {
        resolveMetadata({ geoLocation: 'FR', optinAllowedForGeo: true });
      });

      await waitFor(() => {
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.optinAllowedForGeoLoading).toBe(false);
        expect(rewardsState.geoLocation).toBe('FR');
        expect(rewardsState.optinAllowedForGeo).toBe(true);
      });
    });
  });
});
