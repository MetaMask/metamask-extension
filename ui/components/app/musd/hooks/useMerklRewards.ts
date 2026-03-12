import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import type { Hex } from '@metamask/utils';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import { ELIGIBLE_TOKENS } from '../constants';
import {
  fetchMerklRewardsForAsset,
  getClaimedAmountFromContract,
} from '../merkl-client';
import { getMerklRewardsEnabled } from '../selectors';

const MERKL_REWARDS_STALE_TIME = 2 * 60 * 1000;
const MERKL_REWARDS_CACHE_TIME = 5 * 60 * 1000;

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

type MerklRewardQueryResult = {
  hasClaimable: boolean;
  unclaimedFiat: number | null;
};

const EMPTY_RESULT: MerklRewardQueryResult = {
  hasClaimable: false,
  unclaimedFiat: null,
};

type UseMerklRewardsReturn = {
  isEligible: boolean;
  hasClaimableReward: boolean;
  rewardAmountFiat: number | null;
  refetch: () => void;
};

/**
 * Custom hook to fetch and manage claimable Merkl rewards for an asset.
 * Handles eligibility checking and reward data fetching via TanStack Query,
 * which caches results across component unmount/remount cycles (e.g. tab switches).
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

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const isEligible = useMemo(
    () =>
      showMerklBadge &&
      merklRewardsEnabled &&
      isEligibleForMerklRewards(chainId, tokenAddress),
    [showMerklBadge, merklRewardsEnabled, chainId, tokenAddress],
  );

  const { data: rewardData = EMPTY_RESULT, refetch: refetchQuery } = useQuery({
    queryKey: ['merklRewards', selectedAddress, chainId, tokenAddress],
    queryFn: async ({ signal }): Promise<MerklRewardQueryResult> => {
      if (!tokenAddress || !selectedAddress) {
        return EMPTY_RESULT;
      }

      const matchingReward = await fetchMerklRewardsForAsset(
        tokenAddress,
        chainId,
        selectedAddress,
        signal,
      );

      if (!matchingReward) {
        return EMPTY_RESULT;
      }

      // Get claimed amount from on-chain read for instant update after claims.
      // The API can lag behind the actual on-chain state.
      let claimedAmount = matchingReward.claimed;

      const rewardTokenAddress = matchingReward.token.address as Hex;
      const onChainClaimed = await getClaimedAmountFromContract(
        selectedAddress,
        rewardTokenAddress,
      );

      if (onChainClaimed !== null) {
        claimedAmount = onChainClaimed;
      }

      const unclaimedBaseUnits =
        BigInt(matchingReward.amount) - BigInt(claimedAmount);
      const oneCentInBaseUnits =
        10n ** BigInt(matchingReward.token.decimals - 2);
      const hasClaimable = unclaimedBaseUnits >= oneCentInBaseUnits;

      let unclaimedFiat: number | null = null;
      if (hasClaimable && matchingReward.token.price !== null) {
        const divisor = 10 ** matchingReward.token.decimals;
        unclaimedFiat =
          (Number(unclaimedBaseUnits) / divisor) * matchingReward.token.price;
      }

      return { hasClaimable, unclaimedFiat };
    },
    enabled: isEligible && Boolean(selectedAddress) && Boolean(tokenAddress),
    staleTime: MERKL_REWARDS_STALE_TIME,
    cacheTime: MERKL_REWARDS_CACHE_TIME,
  });

  const refetch = useCallback(() => {
    if (isEligible) {
      refetchQuery();
    }
  }, [refetchQuery, isEligible]);

  return {
    isEligible,
    hasClaimableReward: rewardData.hasClaimable,
    rewardAmountFiat: rewardData.unclaimedFiat,
    refetch,
  };
};
