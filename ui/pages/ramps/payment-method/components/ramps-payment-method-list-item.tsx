import React from 'react';
import type { PaymentMethod } from '@metamask/ramps-controller';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { formatPaymentMethodDelay } from '../utils/format-payment-method-delay';
import { getPaymentMethodIconName } from '../utils/get-payment-method-icon';

export type RampsPaymentMethodListItemProps = {
  paymentMethod: PaymentMethod;
  isSelected?: boolean;
  isDisabled?: boolean;
  /** Buy limits label when published by the selected provider. */
  limitText?: string | null;
  onClick: () => void;
};

/**
 * Payment method row matching mobile `PaymentMethodListItem` layout:
 * logo, name, time estimate, and optional limits.
 * @param options0
 * @param options0.paymentMethod
 * @param options0.isSelected
 * @param options0.isDisabled
 * @param options0.limitText
 * @param options0.onClick
 */
export default function RampsPaymentMethodListItem({
  paymentMethod,
  isSelected = false,
  isDisabled = false,
  limitText = null,
  onClick,
}: RampsPaymentMethodListItemProps) {
  const t = useI18nContext();
  const iconName = getPaymentMethodIconName(
    paymentMethod.paymentType,
    paymentMethod.icon,
  );
  const delayText = formatPaymentMethodDelay(paymentMethod.delay, t);

  return (
    <ButtonBase
      onClick={onClick}
      isDisabled={isDisabled}
      className="w-full rounded-lg px-4 py-3 min-w-0 h-auto hover:bg-hover active:bg-pressed"
      data-testid={`ramps-payment-method-item-${paymentMethod.id}`}
    >
      <Box
        className="w-full"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        gap={3}
      >
        <Box
          className="min-w-0 flex-1"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          <Box
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            backgroundColor={
              isSelected
                ? BoxBackgroundColor.PrimaryMuted
                : BoxBackgroundColor.BackgroundMuted
            }
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
          >
            <Icon
              name={iconName}
              size={IconSize.Md}
              color={
                isSelected ? IconColor.PrimaryDefault : IconColor.IconDefault
              }
            />
          </Box>
          <Box
            className="min-w-0 flex-1"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Start}
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              className="truncate text-left"
            >
              {paymentMethod.name}
            </Text>
            {delayText ? (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="truncate text-left"
                data-testid={`ramps-payment-method-item-delay-${paymentMethod.id}`}
              >
                {delayText}
              </Text>
            ) : null}
            {limitText ? (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="truncate text-left"
                data-testid={`ramps-payment-method-item-limits-${paymentMethod.id}`}
              >
                {limitText}
              </Text>
            ) : null}
          </Box>
        </Box>
        {isSelected ? (
          <Icon
            name={IconName.Check}
            size={IconSize.Md}
            color={IconColor.PrimaryDefault}
            data-testid="ramps-payment-method-item-selected"
          />
        ) : null}
      </Box>
    </ButtonBase>
  );
}
