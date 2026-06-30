import React from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useVipTier } from '../../../hooks/rewards/useVipTier';
import { RewardsIcon, RewardsIconVariant } from './RewardsIcon';

export const RewardsDiscountBadge = ({
  label,
  startIcon,
  testId = 'rewards-discount-badge',
}: {
  label: string;
  startIcon?: ReactNode;
  testId?: string;
}) => (
  <Box
    className={
      // eslint-disable-next-line @metamask/design-tokens/color-no-hex
      'w-max rounded-md bg-gradient-to-r from-[#ECB920] to-[65%] to-[#ECBC2D]/[11%] p-[1px] border-1'
    }
    data-testid={testId}
  >
    <Box className="w-max flex flex-row rounded-md bg-warning-inverse">
      {/* eslint-disable-next-line @metamask/design-tokens/color-no-hex */}
      <Box className="w-max flex flex-row rounded-md whitespace-nowrap px-2 py-0 gap-1 bg-[#ECBC2D]/[11%]">
        {startIcon}
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {label}
        </Text>
      </Box>
    </Box>
  </Box>
);

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
