import React from 'react';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';
import {
  BorderRadius,
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../../components/component-library';
import { loadingOpacity, getDynamicShortDate } from '../../util';
import { useFormatters } from '../../../../hooks/useFormatters';

/**
 * Props for TokenPriceHeader component.
 */
export type TokenPriceHeaderProps = {
  /** Current price to display */
  price?: number;
  /** Pre-computed percentage change (e.g., 5.25 for +5.25%) */
  percentChange?: number;
  /** Currency code for formatting (e.g., 'USD') */
  currency: string;
  /** Timestamp for the price (shown as formatted date) */
  timestamp?: number;
  /** Whether data is currently loading */
  loading?: boolean;
};

/**
 * Skeleton loading state for the main price.
 */
const PriceLoading = () => (
  <Skeleton hideChildren width="25%" className="mb-1 rounded-lg">
    <Text variant={TextVariant.displayMd}>{'\u00A0'}</Text>
  </Skeleton>
);

/**
 * Empty state when price is not available.
 */
const PriceEmptyState = () => (
  <Text variant={TextVariant.displayMd} marginBottom={1}>
    {'\u00A0'}
  </Text>
);

/**
 * Skeleton loading state for the percentage change.
 */
const PercentChangeLoading = () => (
  <Skeleton hideChildren width="33%" className="rounded-lg">
    <Text variant={TextVariant.bodyMdMedium}>{'\u00A0'}</Text>
  </Skeleton>
);

/**
 * Empty state when percentage change is not available.
 */
const PercentChangeEmptyState = () => (
  <Text variant={TextVariant.bodyMdMedium}>{'\u00A0'}</Text>
);

/**
 * Determines the color for the percentage change based on its value.
 */
const getPercentChangeColor = (value: number | undefined): TextColor => {
  if (value === undefined || Number.isNaN(value)) {
    return TextColor.textAlternative;
  }
  if (value === 0) {
    return TextColor.textDefault;
  }
  return value > 0 ? TextColor.successDefault : TextColor.errorDefault;
};

/**
 * A pure display component that shows the price of an asset along with
 * the percentage change. This component is data-agnostic and can be used
 * with both legacy historical price data and OHLCV data.
 *
 * Unlike AssetChartPrice, this component:
 * - Does NOT use imperative refs for hover updates
 * - Does NOT fetch its own data
 * - Accepts pre-computed percentChange directly
 */
const TokenPriceHeader = ({
  price,
  percentChange,
  currency,
  timestamp,
  loading = false,
}: TokenPriceHeaderProps) => {
  const { formatCurrencyTokenPrice, formatNumber } = useFormatters();

  // Determine what to show based on loading state and data availability
  const shouldShowPriceLoading = loading && price === undefined;
  const shouldShowPriceEmptyState = !loading && price === undefined;
  const shouldShowPriceMuted = loading && price !== undefined;
  const shouldShowPrice = !loading && price !== undefined;

  const shouldShowPercentLoading = loading && percentChange === undefined;
  const shouldShowPercentEmptyState = !loading && percentChange === undefined;
  const shouldShowPercentMuted = loading && percentChange !== undefined;
  const shouldShowPercent = !loading && percentChange !== undefined;

  // Format percentage for display
  const formattedPercent =
    typeof percentChange === 'number' && !Number.isNaN(percentChange)
      ? formatNumber(percentChange / 100, {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: 'always',
        })
      : '';

  return (
    <Box marginLeft={4} marginRight={4}>
      {/* Price display */}
      {shouldShowPriceLoading && <PriceLoading />}
      {shouldShowPriceEmptyState && <PriceEmptyState />}
      {(shouldShowPrice || shouldShowPriceMuted) && (
        <Text
          data-testid="token-price-header-price"
          variant={TextVariant.displayMd}
          fontWeight={FontWeight.Medium}
          borderRadius={BorderRadius.LG}
          marginBottom={1}
          style={{ opacity: shouldShowPriceMuted ? loadingOpacity : 1 }}
        >
          {formatCurrencyTokenPrice(price, currency)}
        </Text>
      )}

      {/* Percentage change display */}
      {shouldShowPercentLoading && <PercentChangeLoading />}
      {shouldShowPercentEmptyState && <PercentChangeEmptyState />}
      {(shouldShowPercent || shouldShowPercentMuted) && (
        <Box
          style={{ opacity: loading ? loadingOpacity : 1 }}
          className="flex"
          flexDirection={BoxFlexDirection.Row}
        >
          <Text
            data-testid="token-price-header-percent-change"
            variant={TextVariant.bodyMdMedium}
            color={getPercentChangeColor(percentChange)}
          >
            {formattedPercent || '-'}
          </Text>
          {timestamp !== undefined && (
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
              marginLeft={2}
            >
              {getDynamicShortDate(timestamp)}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TokenPriceHeader;
