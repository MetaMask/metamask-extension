import React from 'react';
import {
  Box,
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

/**
 * "Other options" separator between providers with and without quotes.
 */
export function RampsProviderSeparator() {
  const t = useI18nContext();

  return (
    <Box className="px-4 py-3" data-testid="ramps-provider-separator">
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        fontWeight={FontWeight.Medium}
      >
        {t('rampsOtherOptions')}
      </Text>
    </Box>
  );
}

type RampsQuotesForPaymentMethodBannerProps = {
  paymentMethodName: string;
};

/**
 * Banner noting which payment method the listed quotes apply to.
 *
 * @param options0
 * @param options0.paymentMethodName
 */
export function RampsQuotesForPaymentMethodBanner({
  paymentMethodName,
}: RampsQuotesForPaymentMethodBannerProps) {
  const t = useI18nContext();

  return (
    <Box
      className="mx-2 mb-2 rounded-lg bg-background-muted px-3 py-3"
      data-testid="ramps-provider-quotes-banner"
    >
      <Text variant={TextVariant.BodyMd}>
        {t('rampsQuotesDisplayedFor', [paymentMethodName])}
      </Text>
    </Box>
  );
}
