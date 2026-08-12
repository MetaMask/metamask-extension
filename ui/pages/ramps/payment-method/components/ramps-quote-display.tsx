import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';

export type RampsQuoteDisplayProps = {
  cryptoAmount: string;
  fiatAmount: string | null;
  isLoading?: boolean;
  showWarningIcon?: boolean;
};

/**
 * Right-column quote preview for payment method rows (mobile `QuoteDisplay`).
 *
 * @param options0
 * @param options0.cryptoAmount
 * @param options0.fiatAmount
 * @param options0.isLoading
 * @param options0.showWarningIcon
 */
export default function RampsQuoteDisplay({
  cryptoAmount,
  fiatAmount,
  isLoading = false,
  showWarningIcon = false,
}: RampsQuoteDisplayProps) {
  if (isLoading) {
    return (
      <Box
        className="items-end"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
        data-testid="ramps-quote-display-loading"
      >
        <Skeleton height={16} width={80} className="rounded" />
        <Skeleton height={16} width={60} className="rounded" />
      </Box>
    );
  }

  if (showWarningIcon) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        justifyContent={BoxJustifyContent.Center}
        data-testid="ramps-quote-display-warning"
      >
        <Icon
          name={IconName.Warning}
          size={IconSize.Sm}
          color={IconColor.WarningDefault}
        />
      </Box>
    );
  }

  if (cryptoAmount || fiatAmount !== null) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        data-testid="ramps-quote-display"
      >
        {cryptoAmount ? (
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {cryptoAmount}
          </Text>
        ) : null}
        {fiatAmount === null ? null : (
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {fiatAmount}
          </Text>
        )}
      </Box>
    );
  }

  return null;
}
