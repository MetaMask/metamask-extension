import React, { useCallback } from 'react';
import type { Hex } from '@metamask/utils';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';
import { useMerklRewards } from './hooks/useMerklRewards';

export const ClaimBonusBadge = ({
  label,
  tokenAddress,
  chainId,
  fallback,
}: {
  label: string;
  tokenAddress: string;
  chainId: Hex;
  /** A react element that will be shown in the case that there are no bonuses to claim */
  fallback: React.ReactElement;
}) => {
  const t = useI18nContext();

  // Check whether there are rewards available for the user
  const { claimableReward, refetch } = useMerklRewards({
    tokenAddress,
    chainId,
  });

  // Refetch rewards when a pending claim is confirmed
  useOnMerklClaimConfirmed(refetch);

  const { claimRewards, isClaiming, error } = useMerklClaim({
    tokenAddress,
    chainId,
  });
  // Trigger the claim transaction directly, routing to the confirmation page.
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      claimRewards();
    },
    [claimRewards],
  );

  if (!claimableReward) {
    return fallback;
  }

  if (isClaiming) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Sm}
        color={IconColor.PrimaryDefault}
        style={{ animation: 'spin 1.2s linear infinite' }}
        data-testid="claim-bonus-spinner"
      />
    );
  }

  if (error) {
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.ErrorDefault}
        data-testid="claim-bonus-error"
      >
        {t('merklRewardsUnexpectedError')}
      </Text>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBadgeClick}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
      }}
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.PrimaryDefault}
        data-testid="claim-bonus-badge"
      >
        {label}
      </Text>
    </button>
  );
};
