import React from 'react';
import { TextVariant, TextColor, Text } from '@metamask/design-system-react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';

type RevealSeedWarningProps = {
  message: string;
};

export function RevealSeedWarning({ message }: Readonly<RevealSeedWarningProps>) {
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
