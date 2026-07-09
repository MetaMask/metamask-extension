import React from 'react';
import {
  Box,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { RewardsIcon, RewardsIconVariant } from '../RewardsIcon';
import {
  VIP_GOLD_BACKGROUND_MUTED,
  VIP_GOLD_BORDER_GRADIENT_HEAD,
  VIP_GOLD_BORDER_GRADIENT_TAIL,
  VIP_GOLD_TEXT_DEFAULT,
} from './constants';

/**
 * Gold "VIP" tag shown next to a referral code that belongs to a VIP. Renders a
 * gold fox + "VIP" label with a continuously shifting gold gradient border (the
 * rotating border is driven by rewards-vip-referral-tag.scss; gradient colors
 * are passed in as CSS custom properties).
 */
export const RewardsVipReferralTag = () => {
  const t = useI18nContext();

  return (
    <Box
      className="rewards-vip-referral-tag shrink-0 flex flex-row items-center gap-1.5 rounded-md pl-2.5 pr-2 py-1"
      style={
        {
          backgroundColor: VIP_GOLD_BACKGROUND_MUTED,
          '--rewards-vip-referral-tag-head': VIP_GOLD_BORDER_GRADIENT_HEAD,
          '--rewards-vip-referral-tag-tail': VIP_GOLD_BORDER_GRADIENT_TAIL,
        } as React.CSSProperties
      }
      data-testid="rewards-vip-referral-tag"
    >
      <RewardsIcon variant={RewardsIconVariant.Vip} size={14} />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        style={{ color: VIP_GOLD_TEXT_DEFAULT }}
      >
        {t('rewardsVipReferralTagLabel')}
      </Text>
    </Box>
  );
};

export default RewardsVipReferralTag;
