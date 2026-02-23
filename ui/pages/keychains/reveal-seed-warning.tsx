import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';
import { TextVariant, TextColor, Text } from '@metamask/design-system-react';

interface RevealSeedWarningProps {
  message: string;
}

export function RevealSeedWarning({ message }: RevealSeedWarningProps) {
  return (
    <BannerAlert
      severity={BannerAlertSeverity.Danger}
      data-testid="reveal-seed-warning"
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
        {message}
      </Text>
    </BannerAlert>
  );
}
