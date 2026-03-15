import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
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

const { useSelector } = jest.requireMock('react-redux');
const { useMusdGeoBlocking } = jest.requireMock(
  '../../../../hooks/musd/useMusdGeoBlocking',
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

  afterEach(async () => {
    await queryClient.cancelQueries();
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
    useMusdGeoBlocking.mockReturnValue({
      isBlocked: false,
      userCountry: 'US',
      isLoading: false,
    });
  });

  it('returns false for ineligible token', () => {
    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: '0xunknown',
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: false,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasClaimableReward).toBe(false);
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

    await waitFor(() => {
      expect(result.current.hasClaimableReward).toBe(true);
    });

    // 10.5 - 5.5 = 5.0 MUSD claimable
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
      expect(mockGetClaimedAmountFromContract).toHaveBeenCalled();
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(result.current.hasClaimableReward).toBe(false);
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
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(result.current.hasClaimableReward).toBe(false);
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
      expect(mockGetClaimedAmountFromContract).toHaveBeenCalled();
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(result.current.hasClaimableReward).toBe(false);
  });

  it('handles API errors gracefully', async () => {
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

    await waitFor(() => {
      expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(result.current.hasClaimableReward).toBe(false);
  });

  it('aborts fetch on unmount', async () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    // Use a never-resolving promise so the fetch is still in-flight at unmount time
    mockFetchMerklRewardsForAsset.mockReturnValueOnce(new Promise(() => {}));

    const { unmount } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    // Cancel queries before unmounting to prevent state updates on unmounted component
    await queryClient.cancelQueries();
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
      expect(mockGetClaimedAmountFromContract).toHaveBeenCalled();
      expect(queryClient.isFetching()).toBe(0);
    });

    expect(result.current.hasClaimableReward).toBe(false);
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
  });

  it('returns false and skips API call when user is geoblocked', async () => {
    useMusdGeoBlocking.mockReturnValue({
      isBlocked: true,
      userCountry: 'GB',
      isLoading: false,
    });

    const { result } = renderHook(
      () =>
        useMerklRewards({
          tokenAddress: MUSD_TOKEN_ADDRESS,
          chainId: '0x1' as `0x${string}`,
          showMerklBadge: true,
        }),
      { wrapper: createWrapper() },
    );

    // Query is disabled when geoblocked — no async work to wait for
    expect(result.current.hasClaimableReward).toBe(false);
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
      waitFor,
      unmount,
    } = renderHook(() => useMerklRewards(hookArgs), { wrapper });

    await waitFor(() => {
      expect(firstResult.current.hasClaimableReward).toBe(true);
    });
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
    expect(mockFetchMerklRewardsForAsset).toHaveBeenCalledTimes(1);
  });
});
