import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { computePercentChange } from '../../../../components/app/assets/util/percentChange';
import TokenPriceHeader from './token-price-header';

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
      /** Ambient color override for percent change text (matches chart line color) */
      ambientColor?: string;
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

    const { loading, currency, comparePrice, ambientColor } = props;

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
        ambientColor={ambientColor}
      />
    );
  },
);

export default AssetChartPrice;
