import React from 'react';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ConfirmInfoRow } from '../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../components/app/confirm/info/row/section';
import { RewardsBadge } from '../../../../components/app/rewards/RewardsBadge';
import { useDappSwapComparisonRewardText } from '../../hooks/transactions/dapp-swap-comparison/useDappSwapComparisonRewardText';
import { useSwapCheck } from '../../hooks/transactions/dapp-swap-comparison/useSwapCheck';

export const EstimatedPointsSection = () => {
  const t = useI18nContext();
  const rewards = useDappSwapComparisonRewardText();
  const { isQuotedSwap } = useSwapCheck();

  if (!rewards || !isQuotedSwap) {
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
