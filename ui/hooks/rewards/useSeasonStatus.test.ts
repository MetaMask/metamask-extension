import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import { submitRequestToBackground } from '../../store/background-connection';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { SeasonStatusState } from '../../../shared/types/rewards';
import { useSeasonStatus } from './useSeasonStatus';
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

// Suppress console.log during tests
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

// Mock authorization error callback
const mockOnAuthorizationError = jest.fn().mockResolvedValue(undefined);

describe('useSeasonStatus', () => {
  const mockSeasonMetadata = {
    id: 'season-1',
    name: 'Season 1',
    startDate: 1640995200000, // 2022-01-01
    endDate: 1672531200000, // 2023-01-01
    tiers: [
      {
        id: 'tier-1',
        name: 'Bronze',
        pointsNeeded: 0,
        image: {
          lightModeUrl: 'https://example.com/bronze-light.png',
          darkModeUrl: 'https://example.com/bronze-dark.png',
        },
        levelNumber: '1',
        rewards: [],
      },
      {
        id: 'tier-2',
        name: 'Silver',
        pointsNeeded: 100,
        image: {
          lightModeUrl: 'https://example.com/silver-light.png',
          darkModeUrl: 'https://example.com/silver-dark.png',
        },
        levelNumber: '2',
        rewards: [],
      },
    ],
    lastFetched: Date.now(),
  };

  const mockSeasonStatus: SeasonStatusState = {
    season: {
      id: 'season-1',
      name: 'Season 1',
      startDate: 1640995200000, // 2022-01-01
      endDate: 1672531200000, // 2023-01-01
      tiers: [
        {
          id: 'tier-1',
          name: 'Bronze',
          pointsNeeded: 0,
          image: {
            lightModeUrl: 'https://example.com/bronze-light.png',
            darkModeUrl: 'https://example.com/bronze-dark.png',
          },
          levelNumber: '1',
          rewards: [],
        },
        {
          id: 'tier-2',
          name: 'Silver',
          pointsNeeded: 100,
          image: {
            lightModeUrl: 'https://example.com/silver-light.png',
            darkModeUrl: 'https://example.com/silver-dark.png',
          },
          levelNumber: '2',
          rewards: [],
        },
      ],
      lastFetched: Date.now(),
    },
    balance: {
      total: 50,
      updatedAt: Date.now(),
    },
    tier: {
      currentTier: {
        id: 'tier-1',
        name: 'Bronze',
        pointsNeeded: 0,
        image: {
          lightModeUrl: 'https://example.com/bronze-light.png',
          darkModeUrl: 'https://example.com/bronze-dark.png',
        },
        levelNumber: '1',
        rewards: [],
      },
      nextTier: {
        id: 'tier-2',
        name: 'Silver',
        pointsNeeded: 100,
        image: {
          lightModeUrl: 'https://example.com/silver-light.png',
          darkModeUrl: 'https://example.com/silver-dark.png',
        },
        levelNumber: '2',
        rewards: [],
      },
      nextTierPointsNeeded: 50,
    },
    lastFetched: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRewardsEnabled.mockReturnValue(false); // Start with rewards disabled to prevent auto-fetch
    // Mock submitRequestToBackground to return metadata first, then status
    mockSubmitRequestToBackground.mockImplementation((method) => {
      if (method === 'getRewardsSeasonMetadata') {
        return Promise.resolve(mockSeasonMetadata);
      }
      if (method === 'getRewardsSeasonStatus') {
        return Promise.resolve(mockSeasonStatus);
      }
      return Promise.resolve(null);
    });
    mockOnAuthorizationError.mockClear();
  });

  describe('when rewards are enabled and user is unlocked', () => {
    it('should fetch season status with subscriptionId', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      await waitFor(() => {
        expect(result.current.seasonStatus).toEqual(mockSeasonStatus);
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonMetadata',
        ['current'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonStatus',
        ['test-subscription-id', 'season-1'],
      );
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
    });

    it('should not fetch season status without subscriptionId', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: null,
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('when rewards are disabled', () => {
    it('should not fetch season status', () => {
      mockUseRewardsEnabled.mockReturnValue(false);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('when user is locked', () => {
    it('should not fetch season status', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: false,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('when activeRewardsCaipAccountId is missing', () => {
    it('should not fetch season status when activeRewardsCaipAccountId is null', () => {
      mockUseRewardsEnabled.mockReturnValue(true);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: null,
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should not fetch season status when activeRewardsCaipAccountId is undefined', () => {
      mockUseRewardsEnabled.mockReturnValue(true);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: undefined,
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('should not fetch season status when rewardsActiveAccount.account is null', () => {
      mockUseRewardsEnabled.mockReturnValue(true);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: null,
            },
          },
        },
      );

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();
      expect(result.current.seasonStatusLoading).toBe(false);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test
      const mockError = new Error('Failed to fetch season status');
      mockSubmitRequestToBackground.mockRejectedValue(mockError);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBe(
        'Failed to fetch season status',
      );
      expect(mockLogError).toHaveBeenCalledWith(
        '[useSeasonStatus] Error fetching season status:',
        mockError,
      );
    });

    it('should call onAuthorizationError when authorization fails', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test
      const mockAuthError = new Error('Authorization failed');
      mockAuthError.name = 'AuthorizationFailedError';
      mockSubmitRequestToBackground.mockRejectedValue(mockAuthError);

      const localMockOnAuthorizationError = jest
        .fn()
        .mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: localMockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      expect(localMockOnAuthorizationError).toHaveBeenCalled();
      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBe('Authorization failed');
    });

    it('should not call onAuthorizationError for non-authorization errors', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test
      const mockError = new Error('Network error');
      mockSubmitRequestToBackground.mockRejectedValue(mockError);

      const localMockOnAuthorizationError = jest.fn();

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: localMockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      expect(localMockOnAuthorizationError).not.toHaveBeenCalled();
      expect(result.current.seasonStatusError).toBe('Network error');
    });
  });

  describe('loading states', () => {
    it('should show loading state during fetch', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test
      let resolveMetadataPromise!: (value: typeof mockSeasonMetadata) => void;
      let resolveStatusPromise!: (value: SeasonStatusState) => void;
      const metadataPromise = new Promise<typeof mockSeasonMetadata>(
        (resolve) => {
          resolveMetadataPromise = resolve;
        },
      );
      const statusPromise = new Promise<SeasonStatusState>((resolve) => {
        resolveStatusPromise = resolve;
      });
      mockSubmitRequestToBackground.mockImplementation((method) => {
        if (method === 'getRewardsSeasonMetadata') {
          return metadataPromise;
        }
        if (method === 'getRewardsSeasonStatus') {
          return statusPromise;
        }
        return Promise.resolve(null);
      });

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      expect(result.current.seasonStatusLoading).toBe(true);
      expect(result.current.seasonStatus).toBeNull();
      expect(result.current.seasonStatusError).toBeNull();

      // Resolve metadata first
      resolveMetadataPromise(mockSeasonMetadata);
      // Then resolve status
      resolveStatusPromise(mockSeasonStatus);

      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      expect(result.current.seasonStatus).toEqual(mockSeasonStatus);
    });
  });

  describe('fetchSeasonStatus function', () => {
    it('should expose fetchSeasonStatus function', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      expect(typeof result.current.fetchSeasonStatus).toBe('function');
    });

    it('should allow manual refetch via fetchSeasonStatus', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test

      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      // Clear previous calls
      mockSubmitRequestToBackground.mockClear();

      // Manual refetch
      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonMetadata',
        ['current'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonStatus',
        ['test-subscription-id', 'season-1'],
      );
    });

    it('should not fetch if subscriptionId is not available during manual refetch', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: null,
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      await act(async () => {
        await result.current.fetchSeasonStatus();
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('dependency changes', () => {
    it('should refetch when subscriptionId changes', async () => {
      mockUseRewardsEnabled.mockReturnValue(true); // Enable rewards for this test

      let subscriptionId = 'subscription-1';
      const { result, rerender } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId,
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.seasonStatusLoading).toBe(false);
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonMetadata',
        ['current'],
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'getRewardsSeasonStatus',
        ['subscription-1', 'season-1'],
      );

      // Change subscriptionId and rerender
      subscriptionId = 'subscription-2';
      rerender();

      // Wait for refetch
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'getRewardsSeasonStatus',
          ['subscription-2', 'season-1'],
        );
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(4); // 2 calls for each fetch (metadata + status)
    });
  });

  describe('memoization', () => {
    it('should return stable fetchSeasonStatus function', () => {
      const { result, rerender } = renderHookWithProvider(
        () =>
          useSeasonStatus({
            subscriptionId: 'test-subscription-id',
            onAuthorizationError: mockOnAuthorizationError,
          }),
        {
          metamask: {
            isUnlocked: true,
            rewardsActiveAccount: {
              account: 'test-account-id',
            },
          },
        },
      );

      const firstFetchFunction = result.current.fetchSeasonStatus;

      rerender();

      const secondFetchFunction = result.current.fetchSeasonStatus;

      expect(firstFetchFunction).toBe(secondFetchFunction);
    });
  });
});
