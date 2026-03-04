import React from 'react';
import { TextVariant, TextColor, Text } from '@metamask/design-system-react';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../components/component-library';

type RevealSeedWarningProps = {
  message: string;
  title?: string;
  'data-testid'?: string;
};

export function RevealSeedWarning({
  message,
  title,
  'data-testid': dataTestId = 'reveal-seed-warning',
}: Readonly<RevealSeedWarningProps>) {
  return (
    <BannerAlert
      severity={BannerAlertSeverity.Danger}
      data-testid={dataTestId}
    >
      {title && (
        <Text variant={TextVariant.BodySmBold} color={TextColor.TextDefault}>
          {title}
        </Text>
      )}
      <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
        {message}
      </Text>
    </BannerAlert>
  );
}
