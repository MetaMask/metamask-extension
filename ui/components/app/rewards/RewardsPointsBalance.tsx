import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useRewardsContext } from '../../../contexts/rewards';
import { Skeleton } from '../../component-library/skeleton';

/**
 * Component to display the rewards points balance
 * Shows the points balance with an icon for users who haven't opted in yet
 * (i.e., when rewardsActiveAccount?.subscriptionId is null)
 */
export const RewardsPointsBalance = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const { rewardsEnabled, seasonStatus, seasonStatusLoading } =
    useRewardsContext();

  if (!rewardsEnabled) {
    return null;
  }

  if (seasonStatusLoading && !seasonStatus?.balance) {
    return <Skeleton />;
  }

  // Don't render if there's no points balance to show
  if (seasonStatus?.balance?.total === null) {
    return null;
  }

  // Format the points balance with proper locale-aware number formatting
  const formattedPoints = new Intl.NumberFormat(locale).format(
    seasonStatus?.balance?.total ?? 0,
  );

  return (
    <Box
      className="flex items-center gap-1"
      data-testid="rewards-points-balance"
    >
      <img
        src="./images/metamask-rewards-points.svg"
        alt={t('rewardsPointsIcon')}
        style={{ width: '20px', height: '20px' }}
      />
      <Text
        variant={TextVariant.BodyMd}
        data-testid="rewards-points-balance-value"
      >
        {t('rewardsPointsBalance', [formattedPoints])}
      </Text>
    </Box>
  );
};
