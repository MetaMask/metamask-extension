import { renderHook, act } from '@testing-library/react-hooks';
import * as merklClient from '../merkl-client';
import {
  AGLAMERKL_ADDRESS_MAINNET,
  AGLAMERKL_ADDRESS_LINEA,
  MUSD_TOKEN_ADDRESS,
} from '../constants';
import {
  isEligibleForMerklRewards,
  useMerklRewards,
  formatClaimableAmount,
} from './useMerklRewards';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../merkl-client');

const { useSelector } = jest.requireMock('react-redux');

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

/**
 * Helper to set up useSelector mock with position-based matching.
 * Selectors are called in hook order: account, feature flags.
 * Uses modulo to handle re-renders cleanly.
 *
 * @param overrides - Optional overrides for account, featureFlags
 */
const setupSelectorMock = (overrides: Record<string, unknown> = {}) => {
  const defaults: Record<string, unknown> = {
    account: { address: MOCK_ADDRESS },
    featureFlags: { earnMerklCampaignClaiming: true },
  };
  const config = { ...defaults, ...overrides };
  let callIndex = 0;

  useSelector.mockImplementation(() => {
    const position = callIndex % 2;
    callIndex += 1;
    switch (position) {
      case 0:
        return config.account;
      case 1:
        return config.featureFlags;
      default:
        return undefined;
    }
  });
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

describe('formatClaimableAmount', () => {
  it('returns null for zero amount', () => {
    expect(formatClaimableAmount(0n, 18)).toBeNull();
  });

  it('returns null for negative amount', () => {
    expect(formatClaimableAmount(-1n, 18)).toBeNull();
  });

  it('returns "< 0.01" for very small amounts', () => {
    // 1 wei of an 18-decimal token
    expect(formatClaimableAmount(1n, 18)).toBe('< 0.01');
  });

  it('formats amount with 2 decimal places', () => {
    // 1.5 tokens with 6 decimals = 1500000
    expect(formatClaimableAmount(1500000n, 6)).toBe('1.50');
  });

  it('formats large amounts correctly', () => {
    // 100.99 tokens with 6 decimals = 100990000
    expect(formatClaimableAmount(100990000n, 6)).toBe('100.99');
  });

  it('formats small but displayable amounts', () => {
    // 0.02 tokens with 6 decimals = 20000
    expect(formatClaimableAmount(20000n, 6)).toBe('0.02');
  });

  it('returns null when amount rounds to 0.00', () => {
    // Amount so small it rounds to 0.00 but > 0
    // This would be handled by the < 0.01 check
    expect(formatClaimableAmount(1n, 6)).toBe('< 0.01');
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

  it('returns null claimableReward when feature is disabled', () => {
    setupSelectorMock({ featureFlags: {} });

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    expect(result.current.claimableReward).toBeNull();
    expect(result.current.isFeatureEnabled).toBe(false);
  });

  it('returns null claimableReward for ineligible token', () => {
    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: '0xunknown',
        chainId: '0x1' as `0x${string}`,
      }),
    );

    expect(result.current.claimableReward).toBeNull();
    expect(mockFetchMerklRewardsForAsset).not.toHaveBeenCalled();
  });

  it('fetches and formats claimable reward using API claimed value as fallback', async () => {
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
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.claimableReward).toBe('10.50');
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
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    // 10.5 - 5.5 = 5.0 MUSD claimable
    expect(result.current.claimableReward).toBe('5.00');
    expect(mockGetClaimedAmountFromContract).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      MUSD_TOKEN_ADDRESS,
    );
  });

  it('returns null when on-chain shows all claimed', async () => {
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
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.claimableReward).toBeNull();
  });

  it('returns null when API returns no matching reward', async () => {
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { result } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
      }),
    );

    // Allow the effect to execute and resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockFetchMerklRewardsForAsset).toHaveBeenCalled();
    expect(result.current.claimableReward).toBeNull();
  });

  it('returns null when all rewards are claimed (API)', async () => {
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
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.claimableReward).toBeNull();
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
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.claimableReward).toBeNull();
    consoleSpy.mockRestore();
  });

  it('aborts fetch on unmount', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    mockFetchMerklRewardsForAsset.mockResolvedValueOnce(null);

    const { unmount } = renderHook(() =>
      useMerklRewards({
        tokenAddress: MUSD_TOKEN_ADDRESS,
        chainId: '0x1' as `0x${string}`,
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
      }),
    );

    await act(async () => {
      await waitForNextUpdate();
    });

    // Falls back to API value (claimed=0), so full amount is claimable
    expect(result.current.claimableReward).toBe('10.50');
  });
});
