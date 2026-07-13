import React, { useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import Spinner from '../../../../../components/ui/spinner';

export type RampsPaymentMethodPillProps = {
  label: string;
  isLoading?: boolean;
};

export default function RampsPaymentMethodPill({
  label,
  isLoading = false,
}: RampsPaymentMethodPillProps) {
  if (isLoading) {
    return (
      <Box
        className="inline-flex min-h-9 min-w-[140px] items-center justify-center rounded-full bg-background-alternative px-4 py-2"
        data-testid="ramps-payment-method-pill-loading"
      >
        <Spinner className="h-4 w-4" />
      </Box>
    );
  }

  return (
    <Box
      className="inline-flex items-center gap-2 rounded-full bg-background-alternative px-3 py-2"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      data-testid="ramps-payment-method-pill"
    >
      <Icon
        name={IconName.Card}
        size={IconSize.Sm}
        color={IconColor.IconDefault}
      />
      <Text fontWeight={FontWeight.Medium}>{label}</Text>
      <Icon
        name={IconName.ArrowDown}
        size={IconSize.Sm}
        color={IconColor.IconDefault}
      />
    </Box>
  );
}
