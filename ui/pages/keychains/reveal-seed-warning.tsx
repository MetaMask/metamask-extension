import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  TextVariant,
  TextColor,
  Text,
  FontWeight,
} from '@metamask/design-system-react';

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
    <BannerAlert severity={BannerAlertSeverity.Danger} data-testid={dataTestId}>
      {title && (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Bold}
        >
          {title}
        </Text>
      )}
      <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
        {message}
      </Text>
    </BannerAlert>
  );
}
