import { renderHook, act } from '@testing-library/react-hooks';
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
  });

  describe('fetchCandidateSubscriptionId Function', () => {
    it('should fetch successfully and update state', async () => {
      const mockId = 'test-subscription-id';
      mockSubmitRequestToBackground.mockResolvedValue(mockId);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getCandidateSubscriptionId',
        [],
      );
      expect(result.current.candidateSubscriptionId).toBe(mockId);
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle errors and update error state', async () => {
      const mockError = new Error('API Error');
      mockSubmitRequestToBackground.mockRejectedValue(mockError);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getCandidateSubscriptionId',
        [],
      );
      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(true);
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        mockError,
      );
    });

    it('should reset error state on successful fetch after error', async () => {
      const mockError = new Error('API Error');
      const mockId = 'test-subscription-id';

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      // First call fails
      mockSubmitRequestToBackground.mockRejectedValueOnce(mockError);
      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionIdError).toBe(true);

      // Second call succeeds
      mockSubmitRequestToBackground.mockResolvedValueOnce(mockId);
      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionId).toBe(mockId);
      expect(result.current.candidateSubscriptionIdError).toBe(false);
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
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getCandidateSubscriptionId',
          [],
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
          },
        },
      );

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getCandidateSubscriptionId',
          [],
        );
      });

      await waitFor(() => {
        expect(enabledResult.current.candidateSubscriptionId).toBe(
          'test-id-456',
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(null);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionId).toBeNull();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle undefined response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionId).toBeUndefined();
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should handle empty string response from background', async () => {
      mockSubmitRequestToBackground.mockResolvedValue('');

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(result.current.candidateSubscriptionId).toBe('');
      expect(result.current.candidateSubscriptionIdError).toBe(false);
    });

    it('should maintain function reference stability for fetchCandidateSubscriptionId', () => {
      const initialState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: false,
        },
      };

      const updatedState = {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          isUnlocked: true,
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
