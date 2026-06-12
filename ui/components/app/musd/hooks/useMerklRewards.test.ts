import React from 'react';
import { renderHook, cleanup } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as merklClient from '../merkl-client';
import {
  AGLAMERKL_ADDRESS_MAINNET,
  AGLAMERKL_ADDRESS_LINEA,
  MUSD_TOKEN_ADDRESS,
} from '../constants';
import { isEligibleForMerklRewards, useMerklRewards } from './useMerklRewards';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../merkl-client');

jest.mock('..', () => ({
  useOnMerklClaimConfirmed: jest.fn(),
}));

jest.mock('../../../../hooks/musd/useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(() => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  })),
}));

jest.mock(
  '../../../../pages/confirmations/hooks/tokens/useTokenFiatRates',
  () => ({
    useTokenFiatRate: jest.fn(() => 1.0),
  }),
);

const { useSelector } = jest.requireMock('react-redux');
const { useMusdGeoBlocking } = jest.requireMock(
  '../../../../hooks/musd/useMusdGeoBlocking',
);
const { useTokenFiatRate } = jest.requireMock(
  '../../../../pages/confirmations/hooks/tokens/useTokenFiatRates',
);

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

/**
 * Helper to set up useSelector mock.
 * The hook calls useSelector twice: once for getMerklRewardsEnabled and once
 * for the selected account. mockReturnValue covers both (truthy object for the
 * feature flag, correct shape for the account).
 *
 * @param overrides - Optional overrides
 * @param overrides.account - The mock account object
 */
const setupSelectorMock = (overrides: { account?: unknown } = {}) => {
  const account = overrides.account ?? { address: MOCK_ADDRESS };
  useSelector.mockReturnValue(account);
};

let queryClient: QueryClient;

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('isEligibleForMerklRewards', () => {
  it('returns true for mUSD on mainnet', () => {
    expect(isEligibleForMerklRewards('0x1', MUSD_TOKEN_ADDRESS)).toBe(true);
  });

  it('returns true for mUSD on Linea', () => {
    expect(isEligibleForMerklRewards('0xe708', MUSD_TOKEN_ADDRESS)).toBe(true);
  });

  it('returns true for test token on mainnet', () => {
    expect(isEligibleForMerklRewards('0x1', AGLAMERKL_ADDRESS_MAINNET)).toBe(
      true,
    );
  });

  it('returns true for test token on Linea', () => {
    expect(isEligibleForMerklRewards('0xe708', AGLAMERKL_ADDRESS_LINEA)).toBe(
      true,
    );
  });

  it('returns false for unsupported chain', () => {
    expect(isEligibleForMerklRewards('0x89', MUSD_TOKEN_ADDRESS)).toBe(false);
  });

  it('returns false for unsupported token on supported chain', () => {
    expect(isEligibleForMerklRewards('0x1', '0xunknowntoken')).toBe(false);
  });

  it('returns false for null address', () => {
    expect(isEligibleForMerklRewards('0x1', null)).toBe(false);
  });

  it('returns false for undefined address', () => {
    expect(isEligibleForMerklRewards('0x1', undefined)).toBe(false);
  });

  it('is case-insensitive for address comparison', () => {
    expect(
      isEligibleForMerklRewards('0x1', MUSD_TOKEN_ADDRESS.toLowerCase()),
    ).toBe(true);
    expect(
      isEligibleForMerklRewards('0x1', MUSD_TOKEN_ADDRESS.toUpperCase()),
    ).toBe(true);
  });
});

describe('useMerklRewards', () => {
  const mockFetchMerklRewardsForAsset =
    merklClient.fetchMerklRewardsForAsset as jest.MockedFunction<
      typeof merklClient.fetchMerklRewardsForAsset
    >;

  const mockGetClaimedAmountFromContract =
    merklClient.getClaimedAmountFromContract as jest.MockedFunction<
      typeof merklClient.getClaimedAmountFromContract
    >;

  afterEach(() => {
    cleanup();
    queryClient.clear();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSelectorMock();
    mockGetClaimedAmountFromContract.mockResolvedValue(null);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    // Reset geo-blocking mock to default (not blocked)
    useMusdGeoBlocking.mockReturnValue({
      isBlocked: false,
      userCountry: 'US',
      isLoading: false,
    });
    useTokenFiatRate.mockReturnValue(1.0);
  });

  it('returns isEligible false and hasClaimableReward false for ineligible token', () => {
    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: '0xunknown',
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isEligible).toBe(false);
    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.rewardAmountFiat).toBeNull();
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchMerklRewardsForAsset).not.toHaveBeenCalled();
  });

  it('returns isEligible true for eligible token with showMerklBadge', () => {
    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isEligible).toBe(true);
  });

  it('refetch is a no-op when isEligible is false', () => {
    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: '0xunknown',
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.isEligible).toBe(false);
    result.current.refetch();
    expect(mockFetchMerklRewardsForAsset).not.toHaveBeenCalled();
  });

  it('returns true when claimable reward exists using API claimed value as fallback', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000', // 10.5 MUSD
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    // On-chain read returns null → fallback to API claimed value (0)
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    expect(result.current.rewardAmountFiat).toBe(10.5);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBe('10.50');
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('uses on-chain claimed amount when available', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000', // 10.5 MUSD total
      claimed: '0', // API says 0 claimed (stale)
      recipient: MOCK_ADDRESS,
    });
    // On-chain read says 5.5 MUSD already claimed
    mockGetClaimedAmountFromContract.mockResolvedValueOnce('5500000');

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    // 10.5 - 5.5 = 5.0 MUSD claimable
    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    expect(result.current.rewardAmountFiat).toBe(5.0);
    expect(result.current.hasClaimedBefore).toBe(true);
    expect(result.current.claimableRewardDisplay).toBe('5.00');
    expect(result.current.lifetimeClaimedFiat).toBe(5.5);
    expect(mockGetClaimedAmountFromContract).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      MUSD_TOKEN_ADDRESS,
    );
  });

  it('returns false when on-chain shows all claimed', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '1000000', // 1 MUSD
      claimed: '0', // API says unclaimed (stale)
      recipient: MOCK_ADDRESS,
    });
    // On-chain says all claimed
    mockGetClaimedAmountFromContract.mockResolvedValueOnce('1000000');

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimedBefore).toBe(true);
    });

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.rewardAmountFiat).toBeNull();
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBe(1.0);
  });

  it('returns false when API returns no matching reward', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
    });

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.rewardAmountFiat).toBeNull();
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('returns false when all rewards are claimed (API)', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '1000000',
      claimed: '1000000', // All claimed
      recipient: MOCK_ADDRESS,
    });

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimedBefore).toBe(true);
    });

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBe(1.0);
  });

  it('handles API errors gracefully', async () => {
    jest.spyOn(console, 'error').mockImplementation();
    mockFetchMerklRewardsForAsset.mockRejectedValueOnce(
      new Error('Network error'),
    );

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    // Wait for the rejected promise to be processed — the mock being called
    // proves react-query ran the queryFn and settled (not just default state).
    await waitFor(() => {
      expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
    });

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('aborts fetch on unmount', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { unmount } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it('returns false for sub-cent unclaimed amounts', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '5', // 0.000005 MUSD = $0.000005
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
    });

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('returns true for exactly 1 cent unclaimed amount', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10000', // 0.01 MUSD = $0.01
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    expect(result.current.rewardAmountFiat).toBe(0.01);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBe('0.01');
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('returns false and skips API call when user is geoblocked', () => {
    useMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      userCountry: 'GB',
      isLoading: false,
    });

    // Query is disabled when geoblocked (enabled: false), so state is
    // synchronous — no async cycle to wait for.
    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasClaimableReward).toBe(false);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBeNull();
    expect(result.current.lifetimeClaimedFiat).toBeNull();
    expect(mockFetchMerklRewardsForAsset).not.toHaveBeenCalled();
  });

  it('falls back to API claimed value when getClaimedAmountFromContract returns null', async () => {
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000',
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    // Falls back to API value (claimed=0), so full amount is claimable
    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    expect(result.current.rewardAmountFiat).toBe(10.5);
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBe('10.50');
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('returns null rewardAmountFiat when fiat rate is unavailable', async () => {
    useTokenFiatRate.mockReturnValue(undefined);

    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000',
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    expect(result.current.rewardAmountFiat).toBeNull();
    expect(result.current.hasClaimedBefore).toBe(false);
    expect(result.current.claimableRewardDisplay).toBe('10.50');
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('converts decimal amounts to user fiat currency using fiat rate', async () => {
    useTokenFiatRate.mockReturnValue(1.55);

    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000',
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const { result, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    // 10.5 mUSD × 1.55 AUD/token = 16.275 AUD
    expect(result.current.rewardAmountFiat).toBeCloseTo(16.275);
    expect(result.current.claimableRewardDisplay).toBe('10.50');
    expect(result.current.lifetimeClaimedFiat).toBeNull();
  });

  it('returns cached data on remount without refetching', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000',
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const hookArgs = {
      tokenAddress: MUSD_TOKEN_ADDRESS,
      chainId: '0x1' as `0x${string}`,
      showMerklBadge: true,
    };

    const wrapper = createWrapper();

    // First mount — fetches from API
    const {
      result: firstResult,
      unmount,
      waitFor,
    } = renderHook(() => useMerklRewards(hookArgs), { wrapper });

    await waitFor(() => {
      expect(firstResult.current.hasClaimableReward).toBe(true);
    });

    expect(firstResult.current.claimableRewardDisplay).toBe('10.50');
    expect(firstResult.current.lifetimeClaimedFiat).toBeNull();
    expect(mockFetchMerklRewardsForAsset).toHaveBeenCalledTimes(1);

    // Unmount (simulates switching to another tab)
    unmount();

    // Remount with the same QueryClient (simulates switching back)
    const { result: secondResult } = renderHook(
      () => useMerklRewards(hookArgs),
      { wrapper },
    );

    // Should immediately have the cached value, no additional fetch
    expect(secondResult.current.hasClaimableReward).toBe(true);
    expect(secondResult.current.claimableRewardDisplay).toBe('10.50');
    expect(secondResult.current.lifetimeClaimedFiat).toBeNull();
    expect(mockFetchMerklRewardsForAsset).toHaveBeenCalledTimes(1);
  });

  it('does not leak cached true when showMerklBadge flips to false', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce({
      token: {
        address: MUSD_TOKEN_ADDRESS,
        chainId: 59144,
        symbol: 'MUSD',
        decimals: 6,
        price: 1.0,
      },
      pending: '0',
      proofs: [],
      amount: '10500000',
      claimed: '0',
      recipient: MOCK_ADDRESS,
    });
    mockGetClaimedAmountFromContract.mockResolvedValueOnce(null);

    const wrapper = createWrapper();

    // First render with showMerklBadge=true — populates the cache
    const { result: firstResult, waitFor } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(firstResult.current.hasClaimableReward).toBe(true);
    });

    // Second render with showMerklBadge=false — same queryKey, cache is warm
    const { result: secondResult } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: false,
        }),
      { wrapper },
    );

    // Must be false despite the warm cache
    expect(secondResult.current.hasClaimableReward).toBe(false);
    expect(secondResult.current.hasClaimedBefore).toBe(false);
    expect(secondResult.current.claimableRewardDisplay).toBeNull();
    expect(secondResult.current.lifetimeClaimedFiat).toBeNull();
  });
});
