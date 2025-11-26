import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import log from 'loglevel';
import { useSelector } from 'react-redux';
import { selectBridgeQuotes } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  getRewardsHasAccountOptedIn,
  estimateRewardsPoints,
  getRewardsCandidateSubscriptionId,
  rewardsIsOptInSupported,
} from '../../store/actions';
import { usePrevious } from '../usePrevious';
import { useMultichainSelector } from '../useMultichainSelector';
import {
  getFromToken,
  getToToken,
  getQuoteRequest,
} from '../../ducks/bridge/selectors';
import {
  selectRewardsEnabled,
  selectRewardsAccountLinkedTimestamp,
} from '../../ducks/rewards/selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../selectors/multichain-accounts/account-tree';
import { useRewards, getUsdPricePerToken } from './useRewards';

// Mock dependencies
jest.mock('../../store/actions', () => ({
  getRewardsHasAccountOptedIn: jest.fn(),
  estimateRewardsPoints: jest.fn(),
  getRewardsCandidateSubscriptionId: jest.fn(),
  rewardsIsOptInSupported: jest.fn(),
}));

// Rewards context is no longer used in useRewards; mock redux selector instead

jest.mock('../usePrevious', () => ({
  usePrevious: jest.fn(),
}));

jest.mock('../useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(),
}));

jest.mock('../../ducks/bridge/selectors', () => ({
  getFromToken: jest.fn(),
  getToToken: jest.fn(),
  getQuoteRequest: jest.fn(),
}));

jest.mock('../../ducks/rewards/selectors', () => ({
  selectRewardsEnabled: jest.fn(),
  selectRewardsAccountLinkedTimestamp: jest.fn(),
}));

jest.mock('../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(),
  getSelectedAccountGroup: jest.fn(() => 'account-group-1'),
  getInternalAccountsFromGroupById: jest.fn(() => []),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  setLevel: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockGetRewardsHasAccountOptedIn =
  getRewardsHasAccountOptedIn as jest.MockedFunction<
    typeof getRewardsHasAccountOptedIn
  >;
const mockEstimateRewardsPoints = estimateRewardsPoints as jest.MockedFunction<
  typeof estimateRewardsPoints
>;
const mockGetRewardsCandidateSubscriptionId =
  getRewardsCandidateSubscriptionId as jest.MockedFunction<
    typeof getRewardsCandidateSubscriptionId
  >;
const mockRewardsIsOptInSupported =
  rewardsIsOptInSupported as jest.MockedFunction<
    typeof rewardsIsOptInSupported
  >;
const mockUsePrevious = usePrevious as jest.MockedFunction<typeof usePrevious>;
const mockUseMultichainSelector = useMultichainSelector as jest.MockedFunction<
  typeof useMultichainSelector
>;
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

const mockGetFromToken = getFromToken as jest.MockedFunction<
  typeof getFromToken
>;
const mockGetToToken = getToToken as jest.MockedFunction<typeof getToToken>;
const mockGetQuoteRequest = getQuoteRequest as jest.MockedFunction<
  typeof getQuoteRequest
>;
const mockGetInternalAccountBySelectedAccountGroupAndCaip =
  getInternalAccountBySelectedAccountGroupAndCaip as jest.MockedFunction<
    typeof getInternalAccountBySelectedAccountGroupAndCaip
  >;
const mockSelectRewardsEnabled = selectRewardsEnabled as jest.MockedFunction<
  typeof selectRewardsEnabled
>;
const mockSelectRewardsAccountLinkedTimestamp =
  selectRewardsAccountLinkedTimestamp as jest.MockedFunction<
    typeof selectRewardsAccountLinkedTimestamp
  >;

describe('useRewards', () => {
  const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const mockCaipAccount = 'eip155:1:0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const mockChainId = '1';
  const mockQuoteRequestId = 'quote-123';
  const mockSrcTokenAmount = '1000000000000000000'; // 1 ETH

  const mockFromToken = {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    decimals: 18,
  } as unknown as ReturnType<typeof getFromToken>;

  const mockToToken = {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    symbol: 'USDC',
    decimals: 6,
  } as unknown as ReturnType<typeof getToToken>;

  const mockQuoteRequest = {
    srcTokenAmount: mockSrcTokenAmount,
  } as ReturnType<typeof getQuoteRequest>;

  const mockSelectedAccount = createMockInternalAccount({
    address: mockAddress,
    id: 'account-1',
  });

  const mockActiveQuote = {
    requestId: mockQuoteRequestId,
    srcTokenAmount: '1000000000000000000',
    destTokenAmount: '3000000000',
    srcAsset: {
      assetId: 'eip155:1/slip44:60',
      decimals: 18,
    },
    destAsset: {
      assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
    },
    feeData: {
      metabridge: {
        asset: {
          assetId: 'eip155:1/slip44:60',
          decimals: 18,
        },
        amount: '10000000000000000', // 0.01 ETH
      },
    },
    priceData: {
      totalFeeAmountUsd: '30.00',
    },
  } as unknown as NonNullable<
    ReturnType<typeof selectBridgeQuotes>['activeQuote']
  >['quote'];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUsePrevious.mockReturnValue(undefined);
    mockUseMultichainSelector.mockReturnValue(mockChainId);
    mockGetFromToken.mockReturnValue(mockFromToken);
    mockGetToToken.mockReturnValue(mockToToken);
    mockGetQuoteRequest.mockReturnValue(mockQuoteRequest);
    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(
      mockSelectedAccount,
    );
    mockSelectRewardsEnabled.mockReturnValue(true as never);
    mockSelectRewardsAccountLinkedTimestamp.mockReturnValue(null as never);
    mockGetRewardsCandidateSubscriptionId.mockReturnValue(
      jest.fn().mockResolvedValue('subscription-id'),
    );
    mockRewardsIsOptInSupported.mockReturnValue(
      jest.fn().mockResolvedValue(false),
    );

    mockUseSelector.mockImplementation(((selector: unknown) => {
      if (selector === mockGetFromToken) {
        return mockGetFromToken({} as never);
      }
      if (selector === mockGetToToken) {
        return mockGetToToken({} as never);
      }
      if (selector === mockGetQuoteRequest) {
        return mockGetQuoteRequest({} as never);
      }
      if (selector === mockSelectRewardsEnabled) {
        return mockSelectRewardsEnabled({} as never);
      }
      if (selector === mockSelectRewardsAccountLinkedTimestamp) {
        return mockSelectRewardsAccountLinkedTimestamp({} as never);
      }
      // Handle the account selector
      if (typeof selector === 'function') {
        try {
          const result = selector({} as never);
          return result;
        } catch {
          // Not the account selector or error occurred
        }
      }
      return null;
    }) as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getUsdPricePerToken', () => {
    it('should calculate USD price per token correctly', () => {
      const result = getUsdPricePerToken('30.00', '10000000000000000', 18);
      expect(result).toBe('3000');
    });

    it('should return undefined when totalFeeAmountUsd is zero', () => {
      const result = getUsdPricePerToken('0', '10000000000000000', 18);
      expect(result).toBeUndefined();
    });

    it('should return undefined when feeAmountAtomic is zero', () => {
      const result = getUsdPricePerToken('30.00', '0', 18);
      expect(result).toBeUndefined();
    });

    it('should handle different decimals correctly', () => {
      const result = getUsdPricePerToken('30.00', '30000000', 6);
      expect(result).toBe('1');
    });

    it('should return undefined on error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = getUsdPricePerToken('invalid', 'invalid', 18);
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('Initial State', () => {
    it('should return initial values', () => {
      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: null }),
        {},
      );

      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.estimatedPoints).toBeNull();
      expect(result.current.hasError).toBe(false);
      expect(result.current.accountOptedIn).toBeNull();
      expect(result.current.rewardsAccountScope).toBeNull();
    });
  });

  describe('Early Returns', () => {
    it('should not estimate points when activeQuote is null', async () => {
      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: null }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
        expect(result.current.estimatedPoints).toBeNull();
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
      expect(mockEstimateRewardsPoints).not.toHaveBeenCalled();
    });

    it('should not estimate points when fromToken is missing', async () => {
      mockGetFromToken.mockReturnValue(null);
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return null;
        }
        if (selector === mockGetToToken) {
          return mockGetToToken({} as never);
        }
        if (selector === mockGetQuoteRequest) {
          return mockGetQuoteRequest({} as never);
        }
        if (typeof selector === 'function') {
          try {
            return selector({} as never);
          } catch {
            // Not the account selector
          }
        }
        return null;
      }) as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when toToken is missing', async () => {
      mockGetToToken.mockReturnValue(null);
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return mockGetFromToken({} as never);
        }
        if (selector === mockGetToToken) {
          return null;
        }
        if (selector === mockGetQuoteRequest) {
          return mockGetQuoteRequest({} as never);
        }
        return null;
      }) as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when quoteRequest.srcTokenAmount is missing', async () => {
      mockGetQuoteRequest.mockReturnValue({
        srcTokenAmount: undefined,
      } as ReturnType<typeof getQuoteRequest>);
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return mockGetFromToken({} as never);
        }
        if (selector === mockGetToToken) {
          return mockGetToToken({} as never);
        }
        if (selector === mockGetQuoteRequest) {
          return {
            srcTokenAmount: undefined,
          } as ReturnType<typeof getQuoteRequest>;
        }
        return null;
      }) as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when selectedAccount is missing', async () => {
      mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(
        null as never,
      );
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return mockGetFromToken({} as never);
        }
        if (selector === mockGetToToken) {
          return mockGetToToken({} as never);
        }
        if (selector === mockGetQuoteRequest) {
          return mockGetQuoteRequest({} as never);
        }
        if (typeof selector === 'function') {
          try {
            return selector({} as never);
          } catch {
            // Not the account selector
          }
        }
        return null;
      }) as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when currentChainId is missing', async () => {
      mockUseMultichainSelector.mockReturnValue(null as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when rewardsEnabled is false', async () => {
      mockSelectRewardsEnabled.mockReturnValue(false as never);

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should not estimate points when candidateSubscriptionId is null', async () => {
      mockGetRewardsCandidateSubscriptionId.mockReturnValue(
        jest.fn().mockResolvedValue(null),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
      });

      expect(mockGetRewardsCandidateSubscriptionId).toHaveBeenCalled();
      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });
  });

  describe('Opt-in Check', () => {
    it('should not estimate points when account has not opted in and opt-in is not supported', async () => {
      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(false),
      );
      mockRewardsIsOptInSupported.mockReturnValue(
        jest.fn().mockResolvedValue(false),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.shouldShowRewardsRow).toBe(false);
        expect(result.current.estimatedPoints).toBeNull();
        expect(result.current.accountOptedIn).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalledWith(
        mockCaipAccount,
      );
      expect(mockRewardsIsOptInSupported).toHaveBeenCalledWith({
        account: mockSelectedAccount,
      });
      expect(mockEstimateRewardsPoints).not.toHaveBeenCalled();
    });

    it('should show rewards row when account has not opted in but opt-in is supported, but should not estimate points', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(false),
      );
      mockRewardsIsOptInSupported.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.shouldShowRewardsRow).toBe(true);
        expect(result.current.accountOptedIn).toBe(false);
        expect(result.current.estimatedPoints).toBeNull();
      });

      // Should not estimate points when hasOptedIn is false, even if shouldShow is true
      expect(mockEstimateRewardsPoints).not.toHaveBeenCalled();
    });

    it('should handle errors during opt-in check gracefully', async () => {
      const error = new Error('Opt-in check failed');

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockRejectedValue(error),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasError).toBe(false);
      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.estimatedPoints).toBeNull();
      expect(result.current.accountOptedIn).toBeNull();
      expect(mockEstimateRewardsPoints).not.toHaveBeenCalled();
    });
  });

  describe('Successful Point Estimation', () => {
    it('should estimate points successfully when all conditions are met', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      // Wait for opt-in check
      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      // Advance timers to trigger debounced function
      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockEstimateRewardsPoints).toHaveBeenCalled();
      expect(result.current.estimatedPoints).toBe(100);
      expect(result.current.shouldShowRewardsRow).toBe(true);
      expect(result.current.hasError).toBe(false);
      expect(result.current.accountOptedIn).toBe(true);
      expect(result.current.rewardsAccountScope).toBe(mockSelectedAccount);
    });

    it('should include USD price in fee asset when available', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const estimateCall = mockEstimateRewardsPoints.mock.calls[0];
      const estimateRequest = estimateCall[0];

      expect(
        estimateRequest.activityContext.swapContext?.feeAsset.usdPrice,
      ).toBe('3000');
    });

    it('should omit USD price when calculation fails', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };
      const quoteWithoutUsdPrice = {
        ...mockActiveQuote,
        priceData: {
          totalFeeAmountUsd: '0',
        },
      };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: quoteWithoutUsdPrice }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const estimateCall = mockEstimateRewardsPoints.mock.calls[0];
      const estimateRequest = estimateCall[0];

      expect(
        estimateRequest.activityContext.swapContext?.feeAsset.usdPrice,
      ).toBeUndefined();
    });

    it('should construct correct estimate request', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const estimateCall = mockEstimateRewardsPoints.mock.calls[0];
      const estimateRequest = estimateCall[0];

      expect(estimateRequest.activityType).toBe('SWAP');
      expect(estimateRequest.account).toBe(mockCaipAccount);
      expect(estimateRequest.activityContext.swapContext?.srcAsset).toEqual({
        id: 'eip155:1/slip44:60',
        amount: '1000000000000000000',
      });
      expect(estimateRequest.activityContext.swapContext?.destAsset).toEqual({
        id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amount: '3000000000',
      });
      expect(estimateRequest.activityContext.swapContext?.feeAsset.id).toBe(
        'eip155:1/slip44:60',
      );
      expect(estimateRequest.activityContext.swapContext?.feeAsset.amount).toBe(
        '10000000000000000',
      );
    });
  });

  describe('Debounced Behavior', () => {
    it('should debounce estimateRewardsPoints calls and only make one call when multiple rapid quote changes occur', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result, rerender } = renderHookWithProvider(
        (props?: { activeQuote: typeof mockActiveQuote | null }) =>
          useRewards({ activeQuote: props?.activeQuote ?? null }),
        {},
      );

      // Initial render with first quote
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      // Rapidly change quote multiple times before debounce completes
      const quote2 = {
        ...mockActiveQuote,
        requestId: 'quote-456',
      };
      const quote3 = {
        ...mockActiveQuote,
        requestId: 'quote-789',
      };

      mockUsePrevious.mockReturnValue(mockQuoteRequestId);
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: quote2 });

      // Advance time but not enough to trigger debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      mockUsePrevious.mockReturnValue('quote-456');
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: quote3 });

      // Advance time but still not enough
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Now advance past debounce delay (750ms total)
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only have been called once due to debouncing
      expect(mockEstimateRewardsPoints).toHaveBeenCalledTimes(1);
    });

    it('should make separate calls when quote changes after debounce completes', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result, rerender } = renderHookWithProvider(
        (props?: { activeQuote: typeof mockActiveQuote | null }) =>
          useRewards({ activeQuote: props?.activeQuote ?? null }),
        {},
      );

      // Initial render with first quote
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      // Wait for debounce to complete
      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockEstimateRewardsPoints).toHaveBeenCalledTimes(1);

      // Change quote after debounce completed
      const quote2 = {
        ...mockActiveQuote,
        requestId: 'quote-456',
      };

      mockUsePrevious.mockReturnValue(mockQuoteRequestId);
      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );

      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: quote2 });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalledTimes(2);
      });

      // Wait for second debounce to complete
      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have been called twice - once for each quote after debounce
      expect(mockEstimateRewardsPoints).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during point estimation', async () => {
      const error = new Error('Estimation failed');

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockRejectedValue(error),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasError).toBe(true);
      expect(result.current.estimatedPoints).toBeNull();
      expect(mockLogError).toHaveBeenCalledWith(
        '[useRewardsWithQuote] Error estimating points:',
        error,
      );
    });
  });

  describe('Account Linked Timestamp', () => {
    it('should re-estimate when account is linked and accountOptedIn is false', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(false),
      );
      mockRewardsIsOptInSupported.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );
      mockSelectRewardsAccountLinkedTimestamp.mockReturnValue(null as never);

      const { result, rerender } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.accountOptedIn).toBe(false);
      });

      // Update linked timestamp
      mockSelectRewardsAccountLinkedTimestamp.mockReturnValue(
        1234567890 as never,
      );
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return mockGetFromToken({} as never);
        }
        if (selector === mockGetToToken) {
          return mockGetToToken({} as never);
        }
        if (selector === mockGetQuoteRequest) {
          return mockGetQuoteRequest({} as never);
        }
        if (selector === mockSelectRewardsEnabled) {
          return mockSelectRewardsEnabled({} as never);
        }
        if (selector === mockSelectRewardsAccountLinkedTimestamp) {
          return 1234567890;
        }
        if (typeof selector === 'function') {
          try {
            return selector({} as never);
          } catch {
            // Not the account selector
          }
        }
        return null;
      }) as never);

      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Quote Request ID Changes', () => {
    it('should re-estimate when quote request ID changes', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result, rerender } = renderHookWithProvider(
        (props?: { activeQuote: typeof mockActiveQuote | null }) =>
          useRewards({ activeQuote: props?.activeQuote ?? null }),
        {},
      );

      // First render with initial quote
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockEstimateRewardsPoints).toHaveBeenCalledTimes(1);

      // Second render with different quote ID
      mockUsePrevious.mockReturnValue(mockQuoteRequestId);
      const newQuote = {
        ...mockActiveQuote,
        requestId: 'quote-456',
      };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );

      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: newQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalledTimes(2);
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have been called again for the new quote
      expect(mockEstimateRewardsPoints.mock.calls.length).toBeGreaterThan(1);
    });

    it('should not re-estimate when quote request ID does not change', async () => {
      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result, rerender } = renderHookWithProvider(
        (props?: { activeQuote: typeof mockActiveQuote | null }) =>
          useRewards({ activeQuote: props?.activeQuote ?? null }),
        {},
      );

      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = mockEstimateRewardsPoints.mock.calls.length;

      // Re-render with same quote
      mockUsePrevious.mockReturnValue(mockQuoteRequestId);
      (
        rerender as unknown as (props: {
          activeQuote: typeof mockActiveQuote | null;
        }) => void
      )({ activeQuote: mockActiveQuote });

      // Wait a bit
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have been called again
      expect(mockEstimateRewardsPoints).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Loading State', () => {
    it('should set loading state during estimation', async () => {
      let resolveEstimation: (value: {
        pointsEstimate: number;
        bonusBips: number;
      }) => void;
      const estimationPromise = new Promise<{
        pointsEstimate: number;
        bonusBips: number;
      }>((resolve) => {
        resolveEstimation = resolve;
      });

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockReturnValue(estimationPromise),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
        expect(result.current.shouldShowRewardsRow).toBe(true);
      });

      await act(async () => {
        resolveEstimation({ pointsEstimate: 100, bonusBips: 0 });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Address Formatting', () => {
    it('should handle checksummed addresses', async () => {
      const checksummedAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      const mockAccount = createMockInternalAccount({
        address: checksummedAddress.toLowerCase(),
        id: 'account-1',
      });
      mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(
        mockAccount,
      );
      mockUseSelector.mockImplementation(((selector: unknown) => {
        if (selector === mockGetFromToken) {
          return mockGetFromToken({} as never);
        }
        if (selector === mockGetToToken) {
          return mockGetToToken({} as never);
        }
        if (selector === mockGetQuoteRequest) {
          return mockGetQuoteRequest({} as never);
        }
        if (typeof selector === 'function') {
          try {
            return selector({} as never);
          } catch {
            // Not the account selector
          }
        }
        return null;
      }) as never);

      const mockEstimatedPoints = { pointsEstimate: 100, bonusBips: 0 };

      mockGetRewardsHasAccountOptedIn.mockReturnValue(
        jest.fn().mockResolvedValue(true),
      );
      mockEstimateRewardsPoints.mockReturnValue(
        jest.fn().mockResolvedValue(mockEstimatedPoints),
      );

      const { result } = renderHookWithProvider(
        () => useRewards({ activeQuote: mockActiveQuote }),
        {},
      );

      await waitFor(() => {
        expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
      });

      act(() => {
        jest.advanceTimersByTime(750);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetRewardsHasAccountOptedIn).toHaveBeenCalled();
    });
  });
});
