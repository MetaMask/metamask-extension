import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TrustSignalDisplayState } from '../../../hooks/useTrustSignals';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type TrustSignalPillConfig = {
  icon: IconName;
  iconColor: IconColor;
  textColor: TextColor;
  label: string;
};

export const getTrustSignalPillConfig = (
  state: TrustSignalDisplayState,
  t: (key: string) => string,
): TrustSignalPillConfig | null => {
  switch (state) {
    case TrustSignalDisplayState.Verified:
      return {
        icon: IconName.SecurityTick,
        iconColor: IconColor.SuccessDefault,
        textColor: TextColor.SuccessDefault,
        label: t('securityTrustVerified'),
      };
    case TrustSignalDisplayState.Warning:
      return {
        icon: IconName.Danger,
        iconColor: IconColor.WarningDefault,
        textColor: TextColor.WarningDefault,
        label: t('securityTrustSuspicious'),
      };
    case TrustSignalDisplayState.Malicious:
      return {
        icon: IconName.SecuritySlash,
        iconColor: IconColor.ErrorDefault,
        textColor: TextColor.ErrorDefault,
        label: t('securityTrustMaliciousDappConnection'),
      };
    default:
      return null;
  }
};

type TrustSignalPillProps = {
  state: TrustSignalDisplayState;
  testId?: string;
};

export const TrustSignalPill = ({
  state,
  testId = 'trust-signal-pill',
}: TrustSignalPillProps) => {
  const t = useI18nContext();
  const config = getTrustSignalPillConfig(state, t as (key: string) => string);

  if (!config) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 bg-muted"
      data-testid={testId}
    >
      <Icon name={config.icon} size={IconSize.Sm} color={config.iconColor} />
      <Text
        variant={TextVariant.BodyXs}
        color={config.textColor}
        fontWeight={FontWeight.Medium}
      >
        {config.label}
      </Text>
    </Box>
  );
};
