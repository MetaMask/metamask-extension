import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import { getRemoteFeatureFlags } from '../../../../selectors/remote-feature-flags';
import { ELIGIBLE_TOKENS, MERKL_FEATURE_FLAG_KEY } from '../constants';
import {
  clearRewardCache,
  fetchMerklRewardsForAsset,
  getClaimedAmountFromContract,
} from '../merkl-client';

/**
 * Check if a token is eligible for Merkl rewards.
 * Compares addresses case-insensitively since Ethereum addresses are case-insensitive.
 * Returns false for native tokens (undefined/null address).
 *
 * @param chainId - The chain ID of the token
 * @param address - The token's contract address
 * @returns Whether the token is eligible for Merkl rewards
 */
export const isEligibleForMerklRewards = (
  chainId: string,
  address: string | undefined | null,
): boolean => {
  if (!address) {
    return false;
  }
  const eligibleAddresses = ELIGIBLE_TOKENS[chainId];
  if (!eligibleAddresses) {
    return false;
  }
  const addressLower = address.toLowerCase();
  return eligibleAddresses.some(
    (eligibleAddress) => eligibleAddress.toLowerCase() === addressLower,
  );
};

/**
 * Format unclaimed base units into a human-readable display amount.
 * Returns a string with exactly 2 decimal places, or "< 0.01" for very small amounts.
 *
 * @param unclaimedBaseUnits - The unclaimed amount in base units (wei-like)
 * @param tokenDecimals - The number of decimals for the token
 * @returns Formatted display string, or null if amount is zero
 */
export const formatClaimableAmount = (
  unclaimedBaseUnits: bigint,
  tokenDecimals: number,
): string | null => {
  if (unclaimedBaseUnits <= 0n) {
    return null;
  }

  const divisor = BigInt(10 ** tokenDecimals);
  const whole = unclaimedBaseUnits / divisor;
  const remainder = unclaimedBaseUnits % divisor;

  const decimalPart = Number(remainder) / Number(divisor);
  const totalAmount = Number(whole) + decimalPart;

  if (totalAmount < 0.01) {
    return '< 0.01';
  }

  const displayAmount = totalAmount.toFixed(2);

  return displayAmount;
};

type UseMerklRewardsOptions = {
  tokenAddress: string | undefined;
  chainId: Hex;
};

type UseMerklRewardsReturn = {
  claimableReward: string | null;
  isFeatureEnabled: boolean;
  refetch: () => void;
};

/**
 * Custom hook to fetch and manage claimable Merkl rewards for an asset.
 * Handles eligibility checking, feature flag gating, and reward data fetching.
 * Uses on-chain contract read for the claimed amount (instant update after claim),
 * falling back to API-provided claimed value if the on-chain read fails.
 *
 * @param options - Hook options
 * @param options.tokenAddress - The token's contract address
 * @param options.chainId - The chain ID of the token
 * @returns Claimable reward amount, feature flag state, and refetch function
 */
export const useMerklRewards = ({
  tokenAddress,
  chainId,
}: UseMerklRewardsOptions): UseMerklRewardsReturn => {
  const [claimableReward, setClaimableReward] = useState<string | null>(null);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const isFeatureEnabled = Boolean(
    remoteFeatureFlags?.[MERKL_FEATURE_FLAG_KEY],
  );

  const isEligible = isEligibleForMerklRewards(chainId, tokenAddress);

  const fetchClaimableRewards = useCallback(
    async (abortController: AbortController) => {
      if (
        !tokenAddress ||
        !isEligible ||
        !selectedAddress ||
        !isFeatureEnabled
      ) {
        setClaimableReward(null);
        return;
      }

      try {
        const matchingReward = await fetchMerklRewardsForAsset(
          tokenAddress,
          chainId,
          selectedAddress,
          abortController.signal,
        );

        if (abortController.signal.aborted) {
          return;
        }

        if (!matchingReward) {
          setClaimableReward(null);
          return;
        }

        // Get claimed amount from on-chain read for instant update after claims.
        // The API can lag behind the actual on-chain state.
        let claimedAmount = matchingReward.claimed;

        const rewardTokenAddress = matchingReward.token.address as Hex;
        const onChainClaimed = await getClaimedAmountFromContract(
          selectedAddress,
          rewardTokenAddress,
        );

        if (abortController.signal.aborted) {
          return;
        }

        if (onChainClaimed !== null) {
          // Use on-chain value — it's always more up-to-date than the API
          claimedAmount = onChainClaimed;
        }

        // Calculate unclaimed: total amount from Merkle tree minus what's been claimed
        const unclaimedBaseUnits =
          BigInt(matchingReward.amount) - BigInt(claimedAmount);
        const tokenDecimals = matchingReward.token.decimals ?? 18;

        const displayAmount = formatClaimableAmount(
          unclaimedBaseUnits,
          tokenDecimals,
        );

        if (!abortController.signal.aborted) {
          setClaimableReward(displayAmount);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error(
          'useMerklRewards: Error fetching claimable rewards',
          error,
        );
      }
    },
    [tokenAddress, chainId, selectedAddress, isEligible, isFeatureEnabled],
  );

  // Calling refetch just updates a Fetch Key, which in turn triggers a use effect.
  // This means that we can easily share request aborting logic between the initial
  // call and later refetches
  const [fetchKey, setFetchKey] = useState(0);
  const refetch = useCallback(() => {
    clearRewardCache();
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchClaimableRewards(abortController);
    return () => {
      abortController.abort();
    };
  }, [fetchClaimableRewards, fetchKey]);

  return {
    claimableReward,
    isFeatureEnabled,
    refetch,
  };
};
