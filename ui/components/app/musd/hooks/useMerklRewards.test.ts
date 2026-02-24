import { renderHook, act } from '@testing-library/react-hooks';
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

const { useSelector } = jest.requireMock('react-redux');

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

  beforeEach(() => {
    jest.clearAllMocks();
    setupSelectorMock();
    mockGetClaimedAmountFromContract.mockResolvedValue(null);
  });

  it('returns false for ineligible token', () => {
    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: '0xunknown',
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: false,
      }),
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

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.hasClaimableReward).toBe(true);
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

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    // 10.5 - 5.5 = 5.0 MUSD claimable
    expect(result.current.hasClaimableReward).toBe(true);
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

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.hasClaimableReward).toBe(false);
  });

  it('returns false when API returns no matching reward', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    // Allow the effect to execute and resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
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

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.hasClaimableReward).toBe(false);
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockFetchMerklRewardsForAsset.mockRejectedValueOnce(
      new Error('Network error'),
    );

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.hasClaimableReward).toBe(false);
    consoleSpy.mockRestore();
  });

  it('aborts fetch on unmount', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { unmount } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    unmount();

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
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

    const { result, waitForNextUpdate } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
        showMerklBadge: true,
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    // Falls back to API value (claimed=0), so full amount is claimable
    expect(result.current.hasClaimableReward).toBe(true);
  });
});
