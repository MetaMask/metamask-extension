import React from 'react';
import { useSelector } from 'react-redux';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useRewardsContext } from '../../../contexts/rewards';
import { Skeleton } from '../../component-library/skeleton';
import { RewardsBadge } from './RewardsBadge';

/**
 * Component to display the rewards points balance
 * Shows the points balance with an icon for users who haven't opted in yet
 * (i.e., when rewardsActiveAccount?.subscriptionId is null)
 */
export const RewardsPointsBalance = () => {
  const locale = useSelector(getIntlLocale);

  const {
    rewardsEnabled,
    seasonStatus,
    seasonStatusLoading,
    candidateSubscriptionId,
  } = useRewardsContext();

  if (!rewardsEnabled || !candidateSubscriptionId) {
    return null;
  }

  if (!candidateSubscriptionId) {
    return null;
  }

  if (seasonStatusLoading && !seasonStatus?.balance) {
    return <Skeleton width="100px" />;
  }

  // Format the points balance with proper locale-aware number formatting
  const formattedPoints = new Intl.NumberFormat(locale).format(
    seasonStatus?.balance?.total ?? 0,
  );

  return (
    <RewardsBadge
      formattedPoints={formattedPoints}
      boxClassName="gap-2 px-2 bg-background-muted rounded"
    />
  );
};
