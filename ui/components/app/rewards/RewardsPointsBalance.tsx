import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useRewardsContext } from '../../../contexts/rewards';
import { Skeleton } from '../../component-library/skeleton';

const RewardsBadge = ({ text }: { text: string }) => {
  const t = useI18nContext();

  return (
    <Box
      className="flex items-center gap-1 px-1.5 bg-background-muted rounded"
      data-testid="rewards-points-balance"
    >
      <img
        src="./images/metamask-rewards-points.svg"
        alt={t('rewardsPointsIcon')}
        style={{ width: '16px', height: '16px' }}
      />
      <Text
        variant={TextVariant.BodySm}
        data-testid="rewards-points-balance-value"
      >
        {text}
      </Text>
    </Box>
  );
};

/**
 * Component to display the rewards points balance
 * Shows the points balance with an icon for users who haven't opted in yet
 * (i.e., when rewardsActiveAccount?.subscriptionId is null)
 */
export const RewardsPointsBalance = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);

  const {
    rewardsEnabled,
    seasonStatus,
    seasonStatusLoading,
    candidateSubscriptionId,
  } = useRewardsContext();

  if (!rewardsEnabled) {
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

  return <RewardsBadge text={t('rewardsPointsBalance', [formattedPoints])} />;
};
