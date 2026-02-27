import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import { ELIGIBLE_TOKENS } from '../constants';
import {
  fetchMerklRewardsForAsset,
  getClaimedAmountFromContract,
} from '../merkl-client';
import { getMerklRewardsEnabled } from '../selectors';

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

type UseMerklRewardsOptions = {
  tokenAddress: string | undefined;
  chainId: Hex;
  showMerklBadge: boolean;
};

type UseMerklRewardsReturn = {
  hasClaimableReward: boolean;
  refetch: () => void;
};

/**
 * Custom hook to fetch and manage claimable Merkl rewards for an asset.
 * Handles eligibility checking and reward data fetching.
 * Uses on-chain contract read for the claimed amount (instant update after claim),
 * falling back to API-provided claimed value if the on-chain read fails.
 *
 * @param options - Hook options
 * @param options.tokenAddress - The token's contract address
 * @param options.chainId - The chain ID of the token
 * @param options.showMerklBadge - whether the token should be shown. If false we don't make a request.
 * @returns Whether there is a claimable reward
 */
export const useMerklRewards = ({
  tokenAddress,
  chainId,
  showMerklBadge,
}: UseMerklRewardsOptions): UseMerklRewardsReturn => {
  const merklRewardsEnabled = useSelector(getMerklRewardsEnabled);

  const [hasClaimableReward, setHasClaimableReward] = useState(false);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const isEligible = useMemo(
    () =>
      showMerklBadge &&
      merklRewardsEnabled &&
      isEligibleForMerklRewards(chainId, tokenAddress),
    [showMerklBadge, merklRewardsEnabled, chainId, tokenAddress],
  );

  const fetchClaimableRewards = useCallback(
    async (abortController: AbortController) => {
      if (!tokenAddress || !isEligible || !selectedAddress) {
        setHasClaimableReward(false);
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
          setHasClaimableReward(false);
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

        if (!abortController.signal.aborted) {
          setHasClaimableReward(unclaimedBaseUnits > 0n);
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
    [tokenAddress, chainId, selectedAddress, isEligible],
  );

  // Calling refetch just updates a Fetch Key, which in turn triggers a use effect.
  // This means that we can easily share request aborting logic between the initial
  // call and later refetches
  const [fetchKey, setFetchKey] = useState(0);
  const refetch = useCallback(() => {
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
    hasClaimableReward,
    refetch,
  };
};
