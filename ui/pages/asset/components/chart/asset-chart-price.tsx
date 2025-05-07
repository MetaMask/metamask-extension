import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  BorderRadius,
  Display,
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../components/component-library';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getPricePrecision,
  loadingOpacity,
  getShortDateFormatter,
} from '../../util';
import { Skeleton } from '../../../../components/component-library/skeleton';

/**
 * A component that shows a skeleton loading state in place of the the main price
 * of an asset. It occupies the same space as the main price would, so the layout
 * does not shift when switching from price-loading to price-available.
 */
const AssetChartMainPriceLoading = () => (
  <Skeleton width="25%" marginBottom={1} borderRadius={BorderRadius.LG}>
    <Text variant={TextVariant.displayMd}>{'\u00A0'}</Text>
  </Skeleton>
);

/**
 * Empty state that replaces the main price when it's not available. It occupies
 * the same space as the main price would, so the layout does not shift when
 * switching from price-unavailable to price-available.
 */
const AssetChartMainPriceEmptyState = () => (
  <Text variant={TextVariant.displayMd} marginBottom={1}>
    {'\u00A0'}
  </Text>
);

/**
 * A component that shows a skeleton loading state in place of the the price
 * delta of an asset. It occupies the same space as the price delta would, so
 * the layout does not shift when switching from price-delta-loading to
 * price-delta-available.
 */
const AssetChartDeltaLoading = () => (
  <Skeleton width="33%" borderRadius={BorderRadius.LG}>
    <Text variant={TextVariant.bodyMdMedium}>{'\u00A0'}</Text>
  </Skeleton>
);

/**
 * A component that shows an empty state in place of the the price delta of an
 * asset. It occupies the same space as the price delta would, so the layout
 * does not shift when switching from price-delta-unavailable to
 * price-delta-available.
 */
const AssetChartPriceDeltaEmptyState = () => (
  <Text variant={TextVariant.bodyMdMedium}>{'\u00A0'}</Text>
);

const chartUp = (
  <svg
    className="chart-up"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 3.8125L6.25 7.4875L4.91667 5.3875L2.25 8.1875"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.08398 3.8125H9.75065V5.5625"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const chartDown = (
  <svg
    className="chart-down"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 8.1875L6.25 4.5125L4.91667 6.6125L2.25 3.8125"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.08398 8.1875H9.75065V6.4375"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// A component that shows the price of an asset at a
// certain time, along with the delta from a previous price.
const AssetChartPrice = forwardRef(
  (
    props: {
      loading: boolean;
      currency: string;
      price?: number;
      date: number;
      comparePrice?: number;
    },
    ref,
  ) => {
    const [{ price, date }, setPrice] = useState({
      price: props.price,
      date: props.date,
    });
    useImperativeHandle(ref, () => ({ setPrice }));

    const { loading, currency, comparePrice } = props;
    const priceDelta =
      price !== undefined && comparePrice !== undefined
        ? price - comparePrice
        : undefined;

    // The cases below are intentionally mutually exclusive, in order to flatten the render logic
    const shouldShowMainPriceLoading = loading && price === undefined;
    const shouldShowMainPriceEmptyState = !loading && price === undefined;
    const shouldShowMainPriceMuted = loading && price !== undefined;
    const shouldShowMainPrice = !loading && price !== undefined;

    // Same as above
    const shouldShowDeltaLoading = loading && priceDelta === undefined;
    const shouldShowDeltaEmptyState = !loading && priceDelta === undefined;
    const shouldShowDeltaMuted =
      loading && priceDelta !== undefined && comparePrice !== undefined;
    const shouldShowDelta =
      !loading && priceDelta !== undefined && comparePrice !== undefined;

    return (
      <Box marginLeft={4} marginRight={4}>
        {shouldShowMainPriceLoading && <AssetChartMainPriceLoading />}
        {shouldShowMainPriceEmptyState && <AssetChartMainPriceEmptyState />}
        {(shouldShowMainPrice || shouldShowMainPriceMuted) && (
          <Text
            data-testid="asset-hovered-price"
            variant={TextVariant.displayMd}
            fontWeight={FontWeight.Medium}
            borderRadius={BorderRadius.LG}
            marginBottom={1}
            style={{ opacity: shouldShowMainPriceMuted ? loadingOpacity : 1 }}
          >
            {formatCurrency(`${price}`, currency, getPricePrecision(price))}
          </Text>
        )}
        {shouldShowDeltaLoading && <AssetChartDeltaLoading />}
        {shouldShowDeltaEmptyState && <AssetChartPriceDeltaEmptyState />}
        {(shouldShowDelta || shouldShowDeltaMuted) && (
          <Box style={{ opacity: loading ? loadingOpacity : 1 }}>
            {priceDelta >= 0 ? chartUp : chartDown}
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              marginLeft={1}
              marginRight={1}
              color={
                priceDelta >= 0
                  ? TextColor.successDefault
                  : TextColor.errorDefault
              }
            >
              {formatCurrency(
                `${Math.abs(priceDelta)}`,
                currency,
                getPricePrecision(priceDelta),
              )}{' '}
              ({priceDelta >= 0 ? '+' : ''}
              {(100 * (priceDelta / comparePrice)).toFixed(2)}%)
            </Text>
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {getShortDateFormatter().format(date)}
            </Text>
          </Box>
        )}
      </Box>
    );
  },
);

export default AssetChartPrice;
