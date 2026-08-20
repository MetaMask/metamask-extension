import React from 'react';
import type { Provider, Quote } from '@metamask/ramps-controller';
import {
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
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getRampsListItemClassName } from '../../components/get-ramps-list-item-class-name';
import RampsQuoteDisplay from '../../payment-method/components/ramps-quote-display';
import type { ProviderTag } from '../utils/build-provider-list-items';

export type RampsProviderListItemProps = {
  provider: Provider;
  isSelected?: boolean;
  isDisabled?: boolean;
  tag?: ProviderTag | null;
  subtitle?: string | null;
  showQuote?: boolean;
  quote?: Quote | null;
  quoteLoading?: boolean;
  currency?: string;
  tokenSymbol?: string;
  onClick: () => void;
};

/**
 * Provider row matching mobile ProviderSelection: name (+ optional subtitle)
 * on the left, quote amounts on the right.
 * @param options0
 * @param options0.provider
 * @param options0.isSelected
 * @param options0.isDisabled
 * @param options0.tag
 * @param options0.subtitle
 * @param options0.showQuote
 * @param options0.quote
 * @param options0.quoteLoading
 * @param options0.currency
 * @param options0.tokenSymbol
 * @param options0.onClick
 */
export default function RampsProviderListItem({
  provider,
  isSelected = false,
  isDisabled = false,
  tag = null,
  subtitle = null,
  showQuote = false,
  quote = null,
  quoteLoading = false,
  currency = 'USD',
  tokenSymbol = '',
  onClick,
}: RampsProviderListItemProps) {
  const { formatToken, formatCurrency } = useFormatters();

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
      data-testid={`ramps-provider-item-${provider.id}`}
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
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Start}
          gap={1}
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
              {provider.name}
            </Text>
            {tag ? (
              <Tag
                severity={tag.severity}
                className="shrink-0"
                data-testid={`ramps-provider-item-tag-${provider.id}`}
              >
                {tag.label}
              </Tag>
            ) : null}
          </Box>
          {subtitle ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              className="truncate text-left"
              data-testid={`ramps-provider-item-subtitle-${provider.id}`}
            >
              {subtitle}
            </Text>
          ) : null}
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
              />
            ) : null}
            {isSelected ? (
              <Icon
                name={IconName.Check}
                size={IconSize.Md}
                color={IconColor.PrimaryDefault}
                data-testid="ramps-provider-item-selected"
              />
            ) : null}
          </Box>
        ) : null}
      </Box>
    </ButtonBase>
  );
}
