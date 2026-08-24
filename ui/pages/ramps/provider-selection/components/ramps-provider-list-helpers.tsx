import React from 'react';
import { Box, Text, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type RampsQuotesForPaymentMethodBannerProps = {
  paymentMethodName: string;
};

/**
 * Banner noting which payment method the listed quotes apply to.
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
