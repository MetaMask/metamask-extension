import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { useCandidateSubscriptionId } from './useCandidateSubscriptionId';

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  getRewardsCandidateSubscriptionId: jest.fn(() => async () => null),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  setLevel: jest.fn(),
}));

const { getRewardsCandidateSubscriptionId } = jest.requireMock(
  '../../store/actions',
) as { getRewardsCandidateSubscriptionId: jest.Mock };
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;

describe('useCandidateSubscriptionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns fetch function and initial rewards state is unchanged', () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        mockState,
      );

      expect(typeof result.current.fetchCandidateSubscriptionId).toBe(
        'function',
      );
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
      expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
      expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
    });
  });

  describe('Conditional fetching via useEffect', () => {
    it('does nothing when wallet is locked', async () => {
      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBeNull();
        expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
        expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
      });
    });

    it('does nothing when active account ID is missing', async () => {
      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
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
        expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBeNull();
      });
    });

    it('fetches when unlocked and candidate id is missing or mismatched', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'different-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
        expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
      });
    });
  });

  describe('fetchCandidateSubscriptionId function', () => {
    it('sets loading=true during fetch then false after resolve', async () => {
      let resolveCandidate!: (value: string | null) => void;
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () =>
          new Promise<string | null>((resolve) => {
            resolveCandidate = resolve;
          }),
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
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

      // Start fetch without awaiting completion
      act(() => {
        result.current.fetchCandidateSubscriptionId();
      });

      // Loading should be true while fetch is in-flight
      await waitFor(() => {
        expect(store?.getState().rewards?.candidateSubscriptionIdLoading).toBe(
          true,
        );
      });

      // Resolve mocked action
      act(() => {
        resolveCandidate('abc-id');
      });

      // After resolution, loading returns to false and id updates
      await waitFor(() => {
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
        expect(rewardsState?.candidateSubscriptionId).toBe('abc-id');
        expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
      });
    });
    it('sets to null and does not call action when rewards disabled', async () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: false, // disables rewards via selector
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'sub-xyz',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
      expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
      expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
    });

    it('updates state when action resolves (without auto-effect)', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'resolved-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
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
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
      expect(rewardsState?.candidateSubscriptionId).toBe('resolved-id');
      expect(rewardsState?.candidateSubscriptionIdError).toBe(false);
    });

    it('sets error=true when action throws (without auto-effect)', async () => {
      const mockError = new Error('API Error');
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw mockError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
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
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
      expect(rewardsState?.candidateSubscriptionIdError).toBe(true);
      expect(rewardsState?.candidateSubscriptionIdLoading).toBe(false);
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        mockError,
      );
    });
  });
});
