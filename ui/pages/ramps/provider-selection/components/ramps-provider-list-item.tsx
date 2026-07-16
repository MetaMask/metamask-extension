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
  Text,
  TextColor,
  FontWeight,
  TextVariant,
} from '@metamask/design-system-react';
import { ThemeType } from '../../../../../shared/constants/preferences';
import { resolveRampsContentUrl } from '../../../../hooks/ramps/utils/resolveRampsContentUrl';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useTheme } from '../../../../hooks/useTheme';
import RampsQuoteDisplay from '../../payment-method/components/ramps-quote-display';

export type RampsProviderListItemProps = {
  provider: Provider;
  isSelected?: boolean;
  isDisabled?: boolean;
  subtitle?: string | null;
  showQuote?: boolean;
  quote?: Quote | null;
  quoteLoading?: boolean;
  currency?: string;
  tokenSymbol?: string;
  onClick: () => void;
};

/**
 * Provider wordmark — mirrors portfolio `ProviderLogo`.
 *
 * @param options0
 * @param options0.provider
 */
export function RampsProviderLogo({ provider }: { provider: Provider }) {
  const theme = useTheme();
  const { logos } = provider;
  const pathOrUrl =
    theme === ThemeType.dark
      ? (logos?.dark ?? logos?.light)
      : (logos?.light ?? logos?.dark);
  const url = resolveRampsContentUrl(pathOrUrl);

  if (!url || !logos) {
    return null;
  }

  return (
    <img
      src={url}
      alt={provider.name}
      style={{ width: logos.width, height: logos.height }}
      data-testid={`ramps-provider-item-logo-${provider.id}`}
    />
  );
}

/**
 * Provider row matching portfolio RecommendedQuote layout:
 * wordmark on the left (name only as fallback when logos are missing),
 * quote amounts on the right.
 *
 * @param options0
 * @param options0.provider
 * @param options0.isSelected
 * @param options0.isDisabled
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
  subtitle = null,
  showQuote = false,
  quote = null,
  quoteLoading = false,
  currency = 'USD',
  tokenSymbol = '',
  onClick,
}: RampsProviderListItemProps) {
  const { formatToken, formatCurrency } = useFormatters();
  const hasLogo = Boolean(provider.logos?.light || provider.logos?.dark);

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
      className="w-full rounded-lg px-4 py-3 min-w-0 h-auto hover:bg-hover active:bg-pressed"
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
          {hasLogo ? (
            <RampsProviderLogo provider={provider} />
          ) : (
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              className="truncate text-left"
            >
              {provider.name}
            </Text>
          )}
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
