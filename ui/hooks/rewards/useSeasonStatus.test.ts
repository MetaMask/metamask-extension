import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import {
  SeasonDtoState,
  SeasonStatusState,
} from '../../../shared/types/rewards';
import { useSeasonStatus } from './useSeasonStatus';

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  getRewardsSeasonMetadata: jest.fn(() => async () => null),
  getRewardsSeasonStatus: jest.fn(() => async () => null),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  setLevel: jest.fn(),
}));

const { getRewardsSeasonMetadata, getRewardsSeasonStatus } = jest.requireMock(
  '../../store/actions',
) as {
  getRewardsSeasonMetadata: jest.Mock;
  getRewardsSeasonStatus: jest.Mock;
};
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;

// Common test data
const mockSeasonMetadata: SeasonDtoState = {
  id: 'season-1',
  name: 'Season 1',
  startDate: 1640995200000,
  endDate: 1672531200000,
  tiers: [
    {
      id: 'tier-1',
      name: 'Bronze',
      pointsNeeded: 0,
      image: { lightModeUrl: 'bronze-light', darkModeUrl: 'bronze-dark' },
      levelNumber: '1',
      rewards: [],
    },
    {
      id: 'tier-2',
      name: 'Silver',
      pointsNeeded: 100,
      image: { lightModeUrl: 'silver-light', darkModeUrl: 'silver-dark' },
      levelNumber: '2',
      rewards: [],
    },
  ],
  lastFetched: Date.now(),
};

const mockSeasonStatus: SeasonStatusState = {
  season: mockSeasonMetadata,
  balance: { total: 150, updatedAt: Date.now() },
  tier: {
    currentTier: mockSeasonMetadata.tiers[0],
    nextTier: mockSeasonMetadata.tiers[1],
    nextTierPointsNeeded: 0,
  },
  lastFetched: Date.now(),
};

// Helper to assert store is defined and returns a typed slice
type RewardsSliceForTest = {
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;
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

describe('useSeasonStatus', () => {
  const mockOnAuthorizationError = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('exposes fetch function and state starts unchanged', () => {
      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      expect(typeof result.current.fetchSeasonStatus).toBe('function');
      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.seasonStatus).toBeNull();
      expect(rewardsState.seasonStatusError).toBeNull();
      expect(rewardsState.seasonStatusLoading).toBe(false);
    });
  });

  describe('Conditional fetching via useEffect', () => {
    it('does nothing when wallet is locked', async () => {
      const { store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-1',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsSeasonMetadata).not.toHaveBeenCalled();
        expect(getRewardsSeasonStatus).not.toHaveBeenCalled();
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.seasonStatus).toBeNull();
        expect(rewardsState.seasonStatusLoading).toBe(false);
        expect(rewardsState.seasonStatusError).toBeNull();
      });
    });

    it('does nothing when active account ID is missing', async () => {
      const { store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsSeasonMetadata).not.toHaveBeenCalled();
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.seasonStatus).toBeNull();
      });
    });

    it('fetches when unlocked and rewards enabled with subscriptionId', async () => {
      (getRewardsSeasonMetadata as jest.Mock).mockImplementation(
        () => async () => mockSeasonMetadata,
      );
      (getRewardsSeasonStatus as jest.Mock).mockImplementation(
        () => async () => mockSeasonStatus,
      );

      const { store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-1',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsSeasonMetadata).toHaveBeenCalled();
        expect(getRewardsSeasonStatus).toHaveBeenCalled();
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.seasonStatusLoading).toBe(false);
        expect(rewardsState.seasonStatus).toEqual(mockSeasonStatus);
        expect(rewardsState.seasonStatusError).toBeNull();
      });
    });
  });

  describe('fetchSeasonStatus function', () => {
    it('updates state when action resolves (without auto-effect)', async () => {
      (getRewardsSeasonMetadata as jest.Mock).mockImplementation(
        () => async () => mockSeasonMetadata,
      );
      (getRewardsSeasonStatus as jest.Mock).mockImplementation(
        () => async () => mockSeasonStatus,
      );

      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null, // prevent useEffect auto-fetch
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.seasonStatusLoading).toBe(false);
      expect(rewardsState.seasonStatus).toEqual(mockSeasonStatus);
      expect(rewardsState.seasonStatusError).toBeNull();
    });

    it('sets to null and does not call actions when rewards disabled', async () => {
      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: false, // disables rewards via selector
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'sub-1',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      expect(getRewardsSeasonMetadata).not.toHaveBeenCalled();
      expect(getRewardsSeasonStatus).not.toHaveBeenCalled();
      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.seasonStatus).toBeNull();
      expect(rewardsState.seasonStatusLoading).toBe(false);
      expect(rewardsState.seasonStatusError).toBeNull();
    });

    it('sets error and logs when action throws (non-authorization)', async () => {
      (getRewardsSeasonMetadata as jest.Mock).mockImplementation(
        () => async () => mockSeasonMetadata,
      );
      const mockError = new Error('Network error');
      (getRewardsSeasonStatus as jest.Mock).mockImplementation(
        () => async () => {
          throw mockError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      const rewardsState = getRewardsSlice(store);
      expect(rewardsState.seasonStatus).toBeNull();
      expect(rewardsState.seasonStatusError).toBe('Network error');
      expect(rewardsState.seasonStatusLoading).toBe(false);
      expect(mockLogError).toHaveBeenCalledWith(
        '[useSeasonStatus] Error fetching season status:',
        mockError,
      );
      expect(mockOnAuthorizationError).not.toHaveBeenCalled();
    });

    it('calls onAuthorizationError and clears state on authorization failure', async () => {
      (getRewardsSeasonMetadata as jest.Mock).mockImplementation(
        () => async () => mockSeasonMetadata,
      );
      const mockError = new Error('Authorization failed');
      (getRewardsSeasonStatus as jest.Mock).mockImplementation(
        () => async () => {
          throw mockError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      const rewardsState = getRewardsSlice(store);
      expect(mockOnAuthorizationError).toHaveBeenCalled();
      expect(rewardsState.seasonStatus).toBeNull();
      expect(rewardsState.seasonStatusError).toBe('Authorization failed');
      expect(rewardsState.seasonStatusLoading).toBe(false);
    });

    it('sets loading=true during fetch then false after resolve', async () => {
      let resolveMetadata!: (value: SeasonDtoState | null) => void;
      let resolveStatus!: (value: SeasonStatusState | null) => void;

      (getRewardsSeasonMetadata as jest.Mock).mockImplementation(
        () => async () =>
          new Promise<SeasonDtoState | null>((resolve) => {
            resolveMetadata = resolve;
          }),
      );

      (getRewardsSeasonStatus as jest.Mock).mockImplementation(
        () => async () =>
          new Promise<SeasonStatusState | null>((resolve) => {
            resolveStatus = resolve;
          }),
      );

      const { result, store } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            // Provide active account so manual fetch can proceed
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-1',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      act(() => {
        result.current.fetchSeasonStatus();
      });

      await waitFor(() => {
        expect(getRewardsSlice(store).seasonStatusLoading).toBe(true);
      });

      act(() => {
        resolveMetadata(mockSeasonMetadata);
      });
      // Wait until status fetch is dispatched after metadata resolves
      await waitFor(() => {
        expect(getRewardsSeasonStatus).toHaveBeenCalled();
      });
      act(() => {
        resolveStatus(mockSeasonStatus);
      });

      await waitFor(() => {
        const rewardsState = getRewardsSlice(store);
        expect(rewardsState.seasonStatusLoading).toBe(false);
        expect(rewardsState.seasonStatus).toEqual(mockSeasonStatus);
        expect(rewardsState.seasonStatusError).toBeNull();
      });
    });
  });

  describe('memoization', () => {
    it('returns stable fetchSeasonStatus function across rerenders', () => {
      const { result, rerender } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'sub-1',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-1',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      const firstFn = result.current.fetchSeasonStatus;
      rerender();
      const secondFn = result.current.fetchSeasonStatus;
      expect(firstFn).toBe(secondFn);
    });
  });
});
