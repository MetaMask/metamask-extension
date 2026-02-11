import React, { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import { Box, BoxBorderColor } from '@metamask/design-system-react';
import {
  isEligibleForMerklRewards,
  useMerklRewards,
} from './hooks/useMerklRewards';
import { usePendingMerklClaim } from './hooks/usePendingMerklClaim';
import PendingMerklRewards from './pending-merkl-rewards';
import ClaimMerklRewards from './claim-merkl-rewards';

type MerklRewardsProps = {
  tokenAddress: string;
  chainId: Hex;
};

/**
 * Main component to display Merkl rewards information and claim functionality
 * on the asset details page. Handles eligibility checking, feature flag gating,
 * and reward data fetching internally.
 *
 * Renders a separator, claimable bonus display, and a claim button when the
 * user has unclaimed rewards for the given token.
 *
 * @param props - Component props
 * @param props.tokenAddress - The token's contract address
 * @param props.chainId - The chain ID of the token
 */
const MerklRewards: React.FC<MerklRewardsProps> = ({
  tokenAddress,
  chainId,
}) => {
  const { claimableReward, isFeatureEnabled, refetch } = useMerklRewards({
    tokenAddress,
    chainId,
  });

  const isEligible = isEligibleForMerklRewards(chainId, tokenAddress);

  // Refetch rewards when a pending claim is confirmed
  const handleClaimConfirmed = useCallback(() => {
    refetch();
  }, [refetch]);

  usePendingMerklClaim({ onClaimConfirmed: handleClaimConfirmed });

  if (!isEligible || !isFeatureEnabled || !claimableReward) {
    return null;
  }

  return (
    <div>
      <Box
        borderColor={BoxBorderColor.BorderMuted}
        marginHorizontal={4}
        marginTop={2}
        paddingTop={1}
        style={{ borderTopWidth: '1px', borderTopStyle: 'solid' }}
      />
      <PendingMerklRewards claimableReward={claimableReward} />
      <ClaimMerklRewards tokenAddress={tokenAddress} chainId={chainId} />
    </div>
  );
};

export default MerklRewards;
