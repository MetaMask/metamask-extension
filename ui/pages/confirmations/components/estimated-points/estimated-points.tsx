import React from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ConfirmInfoRow } from '../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../components/app/confirm/info/row/section';
import { RewardsBadge } from '../../../../components/app/rewards/RewardsBadge';
import { useDappSwapComparisonRewardText } from '../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useConfirmContext } from '../../context/confirm';

export const EstimatedPointsSection = () => {
  const t = useI18nContext();
  const rewards = useDappSwapComparisonRewardText();
  const { isQuotedSwapDisplayedInInfo } = useConfirmContext();

  if (!rewards || !isQuotedSwapDisplayedInInfo) {
    return null;
  }

  return (
    <ConfirmInfoSection data-testid="estimated-points-section">
      <ConfirmInfoRow label={t('estimatedPointsRow')}>
        <RewardsBadge formattedPoints={rewards.estimatedPoints.toString()} />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};
