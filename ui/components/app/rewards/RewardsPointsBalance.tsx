import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useRewardsContext } from '../../../contexts/rewards';
import { Skeleton } from '../../component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { RewardsBadge } from './RewardsBadge';

/**
 * Component to display the rewards points balance
 * Shows the points balance with an icon for users who haven't opted in yet
 * (i.e., when rewardsActiveAccount?.subscriptionId is null)
 */
export const RewardsPointsBalance = () => {
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();
  const {
    rewardsEnabled,
    seasonStatus,
    seasonStatusLoading,
    seasonStatusError,
    candidateSubscriptionId,
    refetchSeasonStatus,
  } = useRewardsContext();

  useEffect(() => {
    if (rewardsEnabled) {
      refetchSeasonStatus();
    }
  }, [refetchSeasonStatus, rewardsEnabled]);

  if (!rewardsEnabled || !candidateSubscriptionId) {
    return null;
  }

  if (seasonStatusLoading && !seasonStatus?.balance) {
    return <Skeleton width="100px" />;
  }

  if (seasonStatusError && !seasonStatus?.balance) {
    return (
      <RewardsBadge
        formattedPoints={t('rewardsPointsBalance_couldntLoad')}
        withPointsSuffix={false}
        boxClassName="gap-1 bg-background-transparent"
        textClassName="text-alternative"
        useAlternativeIconColor
      />
    );
  }

  // Format the points balance with proper locale-aware number formatting
  const formattedPoints = new Intl.NumberFormat(locale).format(
    seasonStatus?.balance?.total ?? 0,
  );

  return (
    <RewardsBadge
      formattedPoints={formattedPoints}
      boxClassName="gap-1 px-1.5 bg-background-muted rounded"
    />
  );
};
