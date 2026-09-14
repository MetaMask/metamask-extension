import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import TokenPriceHeader from './token-price-header';

/**
 * Computes percentage change from price and comparePrice.
 * Returns undefined if either value is missing or comparePrice is zero.
 */
function computePercentChange(
  price: number | undefined,
  comparePrice: number | undefined,
): number | undefined {
  if (price === undefined || comparePrice === undefined || comparePrice === 0) {
    return undefined;
  }
  return ((price - comparePrice) / comparePrice) * 100;
}

/**
 * A component that shows the price of an asset at a certain time, along with
 * the percentage change from a previous price. Supports imperative updates
 * for chart hover functionality.
 *
 * This is a wrapper around TokenPriceHeader that adds:
 * - Imperative `setPrice` API for chart hover updates
 * - Computation of percentChange from price/comparePrice
 *
 * For new integrations (e.g., advanced charts with OHLCV data), consider using
 * TokenPriceHeader directly with pre-computed percentChange.
 */
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
    // Local state for hover updates - allows imperative setPrice calls
    const [{ price, date }, setPrice] = useState({
      price: props.price,
      date: props.date,
    });

    // Expose setPrice to parent for chart hover functionality
    useImperativeHandle(ref, () => ({ setPrice }));

    const { loading, currency, comparePrice } = props;

    // Compute percentage change from current price and compare price
    const percentChange = useMemo(
      () => computePercentChange(price, comparePrice),
      [price, comparePrice],
    );

    return (
      <TokenPriceHeader
        price={price}
        percentChange={percentChange}
        currency={currency}
        timestamp={date}
        loading={loading}
      />
    );
  },
);

export default AssetChartPrice;
