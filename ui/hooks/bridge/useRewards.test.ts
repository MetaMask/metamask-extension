import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import log from 'loglevel';
import { useSelector } from 'react-redux';
import { selectBridgeQuotes } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
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
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import {
  useRewards,
  getUsdPricePerToken,
  useRewardsWithQuote,
} from './useRewards';

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

// Mock for primary wallet group accounts
const mockPrimaryWalletGroupAccounts = {
  current: [] as ReturnType<typeof createMockInternalAccount>[],
};
jest.mock('../rewards/usePrimaryWalletGroupAccounts', () => ({
  usePrimaryWalletGroupAccounts: () => ({
    accountGroupId: 'account-group-1',
    accounts: mockPrimaryWalletGroupAccounts.current,
  }),
}));

// Mock for formatAccountToCaipAccountId
const mockFormatAccountToCaipAccountId = { current: jest.fn() };
jest.mock('../../helpers/utils/rewards-utils', () => ({
  formatAccountToCaipAccountId: (...args: unknown[]) =>
    mockFormatAccountToCaipAccountId.current(...args),
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

    // Initialize primary wallet group accounts mock
    mockPrimaryWalletGroupAccounts.current = [mockSelectedAccount];

    // Initialize formatAccountToCaipAccountId mock to return valid CAIP account
    mockFormatAccountToCaipAccountId.current = jest.fn(
      (address: string, chainIdArg: string) =>
        `eip155:${chainIdArg}:${address}`,
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

    // it('should not estimate points when fromToken is missing', async () => {
    //   mockGetFromToken.mockReturnValue(null);
    //   mockUseSelector.mockImplementation(((selector: unknown) => {
    //     if (selector === mockGetFromToken) {
    //       return null;
    //     }
    //     if (selector === mockGetToToken) {
    //       return mockGetToToken({} as never);
    //     }
    //     if (selector === mockGetQuoteRequest) {
    //       return mockGetQuoteRequest({} as never);
    //     }
    //     if (typeof selector === 'function') {
    //       try {
    //         return selector({} as never);
    //       } catch {
    //         // Not the account selector
    //       }
    //     }
    //     return null;
    //   }) as never);

    //   const { result } = renderHookWithProvider(
    //     () => useRewards({ activeQuote: mockActiveQuote }),
    //     {},
    //   );

    //   await waitFor(() => {
    //     expect(result.current.shouldShowRewardsRow).toBe(false);
    //   });

    //   expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    // });

    // it('should not estimate points when toToken is missing', async () => {
    //   mockGetToToken.mockReturnValue(null);
    //   mockUseSelector.mockImplementation(((selector: unknown) => {
    //     if (selector === mockGetFromToken) {
    //       return mockGetFromToken({} as never);
    //     }
    //     if (selector === mockGetToToken) {
    //       return null;
    //     }
    //     if (selector === mockGetQuoteRequest) {
    //       return mockGetQuoteRequest({} as never);
    //     }
    //     return null;
    //   }) as never);

    //   const { result } = renderHookWithProvider(
    //     () => useRewards({ activeQuote: mockActiveQuote }),
    //     {},
    //   );

    //   await waitFor(() => {
    //     expect(result.current.shouldShowRewardsRow).toBe(false);
    //   });

    //   expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    // });

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

      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });
  });

  // The blocks below cover behavior that runs only when REWARDS_SEASON_ACTIVE
  // is true in useRewards.ts. With the flag off the hook short-circuits and
  // never calls the rewards actions, so these are skipped until a season is live.
  describe.skip('Opt-in Check', () => {
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

  describe('useRewardsWithQuote Direct Tests', () => {
    it('should handle null caipAccount from formatAccountToCaipAccountId', async () => {
      // Make formatAccountToCaipAccountId return null
      mockFormatAccountToCaipAccountId.current = jest.fn(() => null);

      mockGetRewardsCandidateSubscriptionId.mockReturnValue(
        jest.fn().mockResolvedValue('subscription-id'),
      );

      const { result } = renderHookWithProvider(
        () =>
          useRewardsWithQuote({
            quote: mockActiveQuote,
            fromAddress: mockAddress,
            fromAddressAccount: mockSelectedAccount,
            chainId: mockChainId,
          }),
        {},
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.estimatedPoints).toBeNull();
      expect(result.current.accountOptedIn).toBeNull();
      expect(mockGetRewardsHasAccountOptedIn).not.toHaveBeenCalled();
    });

    it('should handle missing fromAddress gracefully', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useRewardsWithQuote({
            quote: mockActiveQuote,
            fromAddress: null,
            fromAddressAccount: mockSelectedAccount,
            chainId: mockChainId,
          }),
        {},
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.estimatedPoints).toBeNull();
      expect(mockGetRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
    });

    it('should handle missing chainId gracefully', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useRewardsWithQuote({
            quote: mockActiveQuote,
            fromAddress: mockAddress,
            fromAddressAccount: mockSelectedAccount,
            chainId: null,
          }),
        {},
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.estimatedPoints).toBeNull();
      expect(mockGetRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
    });

    it('should handle rewardsEnabled being false', async () => {
      mockSelectRewardsEnabled.mockReturnValue(false as never);

      const { result } = renderHookWithProvider(
        () =>
          useRewardsWithQuote({
            quote: mockActiveQuote,
            fromAddress: mockAddress,
            fromAddressAccount: mockSelectedAccount,
            chainId: mockChainId,
          }),
        {},
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shouldShowRewardsRow).toBe(false);
      expect(result.current.accountOptedIn).toBeNull();
      expect(mockGetRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
    });
  });
});
