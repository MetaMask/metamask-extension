import React from 'react';
import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
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
  /**
   * Ambient color override for the percent change text.
   * When provided, replaces the default SuccessDefault/ErrorDefault color
   * with the ambient direction color (e.g. custom green or orange).
   * Mirrors mobile's ambient price color A/B test.
   */
  ambientColor?: string;
};

/**
 * Skeleton loading state for the main price.
 */
const PriceLoading = () => (
  <Skeleton hideChildren width="25%" className="mb-1 rounded-lg">
    <Text variant={TextVariant.DisplayMd}>{'\u00A0'}</Text>
  </Skeleton>
);

/**
 * Empty state when price is not available.
 */
const PriceEmptyState = () => (
  <Box marginBottom={1}>
    <Text variant={TextVariant.DisplayMd}>{'\u00A0'}</Text>
  </Box>
);

/**
 * Skeleton loading state for the percentage change.
 */
const PercentChangeLoading = () => (
  <Skeleton hideChildren width="33%" className="rounded-lg">
    <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
      {'\u00A0'}
    </Text>
  </Skeleton>
);

/**
 * Empty state when percentage change is not available.
 */
const PercentChangeEmptyState = () => (
  <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
    {'\u00A0'}
  </Text>
);

/**
 * Determines the color for the percentage change based on its value.
 *
 * @param value - The percentage change value to evaluate
 * @returns The appropriate TextColor for the given value
 */
const getPercentChangeColor = (value: number | undefined): TextColor => {
  if (value === undefined || Number.isNaN(value)) {
    return TextColor.TextAlternative;
  }
  if (value === 0) {
    return TextColor.TextDefault;
  }
  return value > 0 ? TextColor.SuccessDefault : TextColor.ErrorDefault;
};

/**
 * Renders the price section based on loading state and data availability.
 * @param options0
 * @param options0.price
 * @param options0.loading
 * @param options0.formattedPrice
 */
const PriceDisplay = ({
  price,
  loading,
  formattedPrice,
}: {
  price?: number;
  loading: boolean;
  formattedPrice: string;
}) => {
  if (loading && price === undefined) {
    return <PriceLoading />;
  }
  if (!loading && price === undefined) {
    return <PriceEmptyState />;
  }
  return (
    <Box marginBottom={1} style={{ opacity: loading ? loadingOpacity : 1 }}>
      <Text
        data-testid="asset-hovered-price"
        variant={TextVariant.DisplayMd}
        fontWeight={FontWeight.Medium}
      >
        {formattedPrice}
      </Text>
    </Box>
  );
};

/**
 * Renders the percent change section based on loading state and data availability.
 * @param options0
 * @param options0.percentChange
 * @param options0.loading
 * @param options0.formattedPercent
 * @param options0.ambientColor
 * @param options0.timestamp
 */
const PercentChangeDisplay = ({
  percentChange,
  loading,
  formattedPercent,
  ambientColor,
  timestamp,
}: {
  percentChange?: number;
  loading: boolean;
  formattedPercent: string;
  ambientColor?: string;
  timestamp?: number;
}) => {
  if (loading && percentChange === undefined) {
    return <PercentChangeLoading />;
  }
  if (!loading && percentChange === undefined) {
    return <PercentChangeEmptyState />;
  }
  return (
    <Box
      style={{ opacity: loading ? loadingOpacity : 1 }}
      className="flex"
      flexDirection={BoxFlexDirection.Row}
    >
      <Text
        data-testid="asset-price-percent-change"
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        color={ambientColor ? undefined : getPercentChangeColor(percentChange)}
        style={ambientColor ? { color: ambientColor } : undefined}
      >
        {formattedPercent || '-'}
      </Text>
      {timestamp !== undefined && (
        <Box marginLeft={2}>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {getDynamicShortDate(timestamp)}
          </Text>
        </Box>
      )}
    </Box>
  );
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
 *
 * @param options - Component props
 * @param options.price - Current price to display
 * @param options.percentChange - Pre-computed percentage change (e.g., 5.25 for +5.25%)
 * @param options.currency - Currency code for formatting (e.g., 'USD')
 * @param options.timestamp - Timestamp for the price (shown as formatted date)
 * @param options.loading - Whether data is currently loading
 * @param options.ambientColor - Ambient color override for percent change text
 * @returns The rendered TokenPriceHeader component
 */
const TokenPriceHeader = ({
  price,
  percentChange,
  currency,
  timestamp,
  loading = false,
  ambientColor,
}: TokenPriceHeaderProps) => {
  const { formatCurrencyTokenPrice, formatNumber } = useFormatters();

  const formattedPercent =
    typeof percentChange === 'number' && !Number.isNaN(percentChange)
      ? formatNumber(percentChange / 100, {
          style: 'percent',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          signDisplay: 'always',
        })
      : '';

  const formattedPrice =
    price === undefined ? '' : formatCurrencyTokenPrice(price, currency);

  return (
    <Box marginLeft={4} marginRight={4}>
      <PriceDisplay
        price={price}
        loading={loading}
        formattedPrice={formattedPrice}
      />
      <PercentChangeDisplay
        percentChange={percentChange}
        loading={loading}
        formattedPercent={formattedPercent}
        ambientColor={ambientColor}
        timestamp={timestamp}
      />
    </Box>
  );
};

export default TokenPriceHeader;
