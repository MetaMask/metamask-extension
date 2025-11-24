import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
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
    it('returns fetch function and respects initial candidateSubscriptionId sentinel', () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          rewards: {
            candidateSubscriptionId: 'pending',
          },
        },
      );

      expect(typeof result.current.fetchCandidateSubscriptionId).toBe(
        'function',
      );
      const rewardsState = store?.getState().rewards;
      // Initial state uses sentinel value 'pending' and no separate flags
      expect(rewardsState?.candidateSubscriptionId).toBe('pending');
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
        expect(rewardsState?.candidateSubscriptionId).toBe('pending');
      });
    });

    it("fetches when candidateSubscriptionId is 'retry' (regardless of unlock)", async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // ensure unlock effect doesn't trigger
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
          rewards: {
            candidateSubscriptionId: 'retry',
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });

    it('uses rewardsActiveAccountSubscriptionId when available instead of fetching', async () => {
      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'active-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('active-sub-id');
      });
    });

    it('fetches when unlocked and rewardsActiveAccountSubscriptionId is null', async () => {
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
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });

    it('fetches when unlocked and rewardsActiveAccount has null subscriptionId', async () => {
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
              subscriptionId: null,
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });
  });

  describe('fetchCandidateSubscriptionId function', () => {
    it('updates state to returned id when action resolves', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'abc-id',
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
      expect(rewardsState?.candidateSubscriptionId).toBe('abc-id');
    });
    it('uses rewardsActiveAccountSubscriptionId when available and does not fetch', async () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'active-sub-id',
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
      expect(rewardsState?.candidateSubscriptionId).toBe('active-sub-id');
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
      expect(rewardsState?.candidateSubscriptionId).toBe('resolved-id');
    });

    it("sets candidateSubscriptionId to 'error' when action throws (without auto-effect)", async () => {
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
      expect(rewardsState?.candidateSubscriptionId).toBe('error');
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        mockError,
      );
    });
  });
});
