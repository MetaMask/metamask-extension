import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useEffect,
} from 'react';
import { computePercentChange } from '../../../../components/app/assets/util/percentChange';
import TokenPriceHeader from './token-price-header';

/** Header state. `hovered` is true while the pointer is on the chart. */
type AssetChartPriceState = {
  price?: number;
  date?: number;
  hovered?: boolean;
};

/**
 * A component that shows the price of an asset at a certain time, along with
 * the percentage change from a previous price. Supports imperative updates
 * for chart hover functionality.
 *
 * This is a wrapper around TokenPriceHeader that adds:
 * - Imperative `setPrice` API for chart hover updates
 * - Computation of percentChange from price/comparePrice
 * - A resting percent change from the live quote, used whenever the pointer is
 *   not on the chart
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
      /** 1d change from the live quote. Shown while not hovering the chart. */
      livePercentChange1d?: number;
    },
    ref,
  ) => {
    // Local state for hover updates - allows imperative setPrice calls
    const [{ price, date, hovered }, setPrice] = useState<AssetChartPriceState>(
      {
        price: props.price,
        date: props.date,
        hovered: false,
      },
    );

    // Expose setPrice to parent for chart hover functionality
    useImperativeHandle(ref, () => ({ setPrice }));

    // The header is local state so hover can replace it. Follow the streamed
    // price when that prop changes; hover is cleared by the next tick.
    useEffect(() => {
      setPrice({ price: props.price, date: Date.now(), hovered: false });
    }, [props.price]);

    const { loading, currency, comparePrice, livePercentChange1d } = props;

    // At rest the percent is the shared 1d change. Hover keeps the chart's
    // range change.
    const percentChange = useMemo(() => {
      if (hovered) {
        return computePercentChange(price, comparePrice);
      }
      return livePercentChange1d;
    }, [hovered, livePercentChange1d, price, comparePrice]);

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
