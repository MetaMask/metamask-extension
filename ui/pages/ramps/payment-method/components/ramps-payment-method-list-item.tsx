import React from 'react';
import type { PaymentMethod, Quote } from '@metamask/ramps-controller';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Tag,
  TagSeverity,
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getRampsListItemClassName } from '../../components/get-ramps-list-item-class-name';
import { formatPaymentMethodDelay } from '../utils/format-payment-method-delay';
import { getPaymentMethodIconName } from '../utils/get-payment-method-icon';
import RampsQuoteDisplay from './ramps-quote-display';

export type RampsPaymentMethodListItemProps = {
  paymentMethod: PaymentMethod;
  isSelected?: boolean;
  isDisabled?: boolean;
  isPreviouslyUsed?: boolean;
  limitText?: string | null;
  showQuote?: boolean;
  quote?: Quote | null;
  quoteLoading?: boolean;
  quoteError?: boolean;
  quoteErrorMessage?: string;
  currency?: string;
  tokenSymbol?: string;
  onClick: () => void;
};

/**
 * Payment method row matching mobile `PaymentMethodListItem` layout:
 * logo, name, time estimate, optional limits, and optional quote preview.
 * @param options0
 * @param options0.paymentMethod
 * @param options0.isSelected
 * @param options0.isDisabled
 * @param options0.isPreviouslyUsed
 * @param options0.limitText
 * @param options0.showQuote
 * @param options0.quote
 * @param options0.quoteLoading
 * @param options0.quoteError
 * @param options0.quoteErrorMessage
 * @param options0.currency
 * @param options0.tokenSymbol
 * @param options0.onClick
 */
export default function RampsPaymentMethodListItem({
  paymentMethod,
  isSelected = false,
  isDisabled = false,
  isPreviouslyUsed = false,
  limitText = null,
  showQuote = false,
  quote = null,
  quoteLoading = false,
  quoteError = false,
  quoteErrorMessage,
  currency = 'USD',
  tokenSymbol = '',
  onClick,
}: RampsPaymentMethodListItemProps) {
  const t = useI18nContext();
  const { formatToken, formatCurrency } = useFormatters();
  const iconName = getPaymentMethodIconName(
    paymentMethod.paymentType,
    paymentMethod.icon,
  );
  const delayText = formatPaymentMethodDelay(paymentMethod.delay, t);
  const detailText = [delayText, limitText].filter(Boolean).join(' • ');
  const subtitleText =
    quoteError && quoteErrorMessage ? quoteErrorMessage : detailText;

  const cryptoAmount =
    quote?.quote?.amountOut !== undefined &&
    quote.quote.amountOut !== null &&
    tokenSymbol
      ? formatToken(Number(quote.quote.amountOut), tokenSymbol, {
          maximumFractionDigits: 6,
          minimumFractionDigits: 0,
        })
      : '';
  const fiatAmount =
    quote?.quote?.amountOutInFiat !== undefined &&
    quote.quote.amountOutInFiat !== null
      ? formatCurrency(Number(quote.quote.amountOutInFiat), currency)
      : null;

  return (
    <ButtonBase
      onClick={onClick}
      isDisabled={isDisabled}
      className={getRampsListItemClassName(isSelected)}
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
          <AvatarIcon
            iconName={iconName}
            size={AvatarIconSize.Lg}
            severity={AvatarIconSeverity.Neutral}
            className="shrink-0"
          />
          <Box
            className="min-w-0 flex-1"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Start}
          >
            <Box
              className="w-full min-w-0"
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={2}
            >
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                className="truncate text-left"
              >
                {paymentMethod.name}
              </Text>
              {isPreviouslyUsed ? (
                <Tag
                  severity={TagSeverity.Info}
                  className="shrink-0"
                  data-testid={`ramps-payment-method-item-tag-${paymentMethod.id}`}
                >
                  {t('rampsPreviouslyUsed')}
                </Tag>
              ) : null}
            </Box>
            {subtitleText ? (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="truncate text-left"
                data-testid={`ramps-payment-method-item-delay-${paymentMethod.id}`}
              >
                {subtitleText}
              </Text>
            ) : null}
          </Box>
        </Box>
        {showQuote || isSelected ? (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
            className="shrink-0"
          >
            {showQuote ? (
              <RampsQuoteDisplay
                cryptoAmount={cryptoAmount}
                fiatAmount={fiatAmount}
                isLoading={quoteLoading}
                showWarningIcon={quoteError}
              />
            ) : null}
            {isSelected ? (
              <Icon
                name={IconName.Check}
                size={IconSize.Lg}
                color={IconColor.IconDefault}
                data-testid="ramps-payment-method-item-selected"
              />
            ) : null}
          </Box>
        ) : null}
      </Box>
    </ButtonBase>
  );
}
