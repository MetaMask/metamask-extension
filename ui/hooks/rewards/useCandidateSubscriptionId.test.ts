import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import { submitRequestToBackground } from '../../store/background-connection';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import mockState from '../../../test/data/mock-state.json';
import { useCandidateSubscriptionId } from './useCandidateSubscriptionId';
import { useRewardsEnabled } from './useRewardsEnabled';

// Mock dependencies
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('./useRewardsEnabled', () => ({
  useRewardsEnabled: jest.fn(),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  setLevel: jest.fn(),
}));

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
});

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;
const mockUseRewardsEnabled = useRewardsEnabled as jest.MockedFunction<
  typeof useRewardsEnabled
>;
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;

describe('useCandidateSubscriptionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRewardsEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial values', () => {
      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        mockState,
      );

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
      expect(typeof result.current.fetchCandidateSubscriptionId).toBe(
        'function',
      );
    });
  });

  describe('Conditional Fetching', () => {
    it('should not fetch when rewards are disabled', () => {
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should not fetch when wallet is locked', () => {
      mockUseRewardsEnabled.mockReturnValue(true);

      const testState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: false,
          rewardsActiveAccount: {
            account: 'eip155:1:0x123',
            subscriptionId: 'sub-123',
          },
          rewardsSubscriptions: {},
        },
      };

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        testState,
      );

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should not fetch when rewardsActiveAccountCaipAccountId is missing', () => {
      mockUseRewardsEnabled.mockReturnValue(true);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should fetch when subscription IDs do not match', async () => {
      mockUseRewardsEnabled.mockReturnValue(true);
      mockSubmitRequestToBackground.mockResolvedValue('new-sub-id');

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'different-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });

      await waitFor(() => {
        expect(result.current.candidateSubscriptionId).toBe('new-sub-id');
      });
    });
  });

  describe('fetchCandidateSubscriptionId Function', () => {
    it('should fetch successfully and update state', async () => {
      const mockId = 'test-subscription-id';
      mockSubmitRequestToBackground.mockResolvedValue(mockId);

      // Start with rewards disabled to prevent useEffect from auto-fetching
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // Lock wallet to prevent useEffect from auto-fetching
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Clear any calls that may have happened during render
      mockSubmitRequestToBackground.mockClear();

      // Enable rewards and rerender to update the hook's callback
      mockUseRewardsEnabled.mockReturnValue(true);
      act(() => {
        rerender();
      });

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });
      expect(result.current.candidateSubscriptionId).toBe(mockId);
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle errors and update error state', async () => {
      const mockError = new Error('API Error');
      mockSubmitRequestToBackground.mockRejectedValue(mockError);

      // Start with rewards disabled to prevent useEffect from auto-fetching
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // Lock wallet to prevent useEffect from auto-fetching
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Clear any calls that may have happened during render
      mockSubmitRequestToBackground.mockClear();

      // Enable rewards and rerender to update the hook's callback
      mockUseRewardsEnabled.mockReturnValue(true);
      act(() => {
        rerender();
      });

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });
      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(true);
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        mockError,
      );
    });
  });

  describe('useEffect Behavior', () => {
    it('should fetch when wallet becomes unlocked', async () => {
      mockUseRewardsEnabled.mockReturnValue(true);
      mockSubmitRequestToBackground.mockResolvedValue('test-id-123');

      // Test with locked wallet first
      const { result: lockedResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Initially should not fetch
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      expect(lockedResult.current.candidateSubscriptionId).toBeNull();

      // Test with unlocked wallet
      const { result: unlockedResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });

      await waitFor(() => {
        expect(unlockedResult.current.candidateSubscriptionId).toBe(
          'test-id-123',
        );
      });
    });

    it('should fetch when rewards become enabled', async () => {
      mockSubmitRequestToBackground.mockResolvedValue('test-id-456');

      // Test with rewards disabled first
      const mockUseRewardsEnabledLocal = useRewardsEnabled as jest.Mock;
      mockUseRewardsEnabledLocal.mockReturnValue(false);

      const { result: disabledResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Initially should not fetch
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      expect(disabledResult.current.candidateSubscriptionId).toBeNull();

      // Test with rewards enabled
      mockUseRewardsEnabledLocal.mockReturnValue(true);

      const { result: enabledResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });

      await waitFor(() => {
        expect(enabledResult.current.candidateSubscriptionId).toBe(
          'test-id-456',
        );
      });
    });

    it('should fetch when rewardsActiveAccountCaipAccountId becomes available', async () => {
      mockUseRewardsEnabled.mockReturnValue(true);
      mockSubmitRequestToBackground.mockResolvedValue('test-id-789');

      // Test without rewardsActiveAccount
      const { result: noAccountResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      // Initially should not fetch
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      expect(noAccountResult.current.candidateSubscriptionId).toBeNull();

      // Test with rewardsActiveAccount
      const { result: withAccountResult } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsCandidateSubscriptionId',
        );
      });

      await waitFor(() => {
        expect(withAccountResult.current.candidateSubscriptionId).toBe(
          'test-id-789',
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(null);

      // Start with rewards disabled to prevent useEffect from auto-fetching
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // Lock wallet to prevent useEffect from auto-fetching
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Clear any calls that may have happened during render
      mockSubmitRequestToBackground.mockClear();

      // Enable rewards and rerender to update the hook's callback
      mockUseRewardsEnabled.mockReturnValue(true);
      act(() => {
        rerender();
      });

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle undefined response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      // Start with rewards disabled to prevent useEffect from auto-fetching
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // Lock wallet to prevent useEffect from auto-fetching
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Clear any calls that may have happened during render
      mockSubmitRequestToBackground.mockClear();

      // Enable rewards and rerender to update the hook's callback
      mockUseRewardsEnabled.mockReturnValue(true);
      act(() => {
        rerender();
      });

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      // The implementation preserves undefined as-is
      expect(result.current.candidateSubscriptionId).toBeUndefined();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle empty string response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue('');

      // Start with rewards disabled to prevent useEffect from auto-fetching
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // Lock wallet to prevent useEffect from auto-fetching
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      // Clear any calls that may have happened during render
      mockSubmitRequestToBackground.mockClear();

      // Enable rewards and rerender to update the hook's callback
      mockUseRewardsEnabled.mockReturnValue(true);
      act(() => {
        rerender();
      });

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      // Empty string should be preserved as it's a valid string value
      // However, if the implementation converts it to null, that's also acceptable
      // since empty strings aren't valid subscription IDs
      expect(result.current.candidateSubscriptionId).toBe('');
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should maintain function reference stability for fetchCandidateSubscriptionId', () => {
      const initialState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: false,
          rewardsActiveAccount: {
            account: 'eip155:1:0x123',
            subscriptionId: 'sub-123',
          },
          rewardsSubscriptions: {},
        },
      };

      const updatedState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: true,
          rewardsActiveAccount: {
            account: 'eip155:1:0x123',
            subscriptionId: 'sub-123',
          },
          rewardsSubscriptions: {},
        },
      };

      const { result, rerender } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        initialState,
      );

      const firstFetchFunction = result.current.fetchCandidateSubscriptionId;

      rerender({ children: updatedState });

      const secondFetchFunction = result.current.fetchCandidateSubscriptionId;

      expect(firstFetchFunction).toBe(secondFetchFunction);
    });
  });
});
