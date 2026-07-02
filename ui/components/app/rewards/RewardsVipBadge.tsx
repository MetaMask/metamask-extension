import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useVipTier } from '../../../hooks/rewards/useVipTier';
import { RewardsIcon, RewardsIconVariant } from './RewardsIcon';
import { RewardsDiscountBadge } from './RewardsDiscountBadge';

export const RewardsVipBadge = () => {
  const t = useI18nContext();
  const vipTier = useVipTier();

  if (!vipTier) {
    return null;
  }

  return (
    <RewardsDiscountBadge
      testId="rewards-vip-badge"
      startIcon={<RewardsIcon variant={RewardsIconVariant.Vip} size={14} />}
      label={t('vip', [vipTier])}
    />
  );
};
