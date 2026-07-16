import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import Spinner from '../../../../components/ui/spinner';

export type RampsPaymentMethodPillProps = {
  label: string;
  isLoading?: boolean;
  onClick?: () => void;
};

export default function RampsPaymentMethodPill({
  label,
  isLoading = false,
  onClick,
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
    <ButtonBase
      onClick={onClick}
      isDisabled={!onClick}
      className="inline-flex items-center gap-2 rounded-full bg-background-alternative px-3 py-2 min-w-0 h-auto hover:bg-hover active:bg-pressed"
      data-testid="ramps-payment-method-pill"
    >
      <Box
        className="inline-flex items-center gap-2"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
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
    </ButtonBase>
  );
}
