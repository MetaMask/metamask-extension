import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { computePercentChange } from '../../../../components/app/assets/util/percentChange';
import TokenPriceHeader from './token-price-header';

/** Hover update from the chart. `hovered` is true while the pointer is on it. */
type HoverUpdate = {
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
    const { loading, currency, comparePrice } = props;

    // Only the hovered point is state. At rest the price and date come from
    // props, so a streamed tick updates the header without clearing a hover.
    const [hoverPoint, setHoverPoint] = useState<
      { price?: number; date?: number } | undefined
    >();

    // Expose setPrice to parent for chart hover functionality
    useImperativeHandle(ref, () => ({
      setPrice: ({
        price: hoverPrice,
        date: hoverDate,
        hovered,
      }: HoverUpdate) =>
        setHoverPoint(
          hovered ? { price: hoverPrice, date: hoverDate } : undefined,
        ),
    }));

    const price = hoverPoint ? hoverPoint.price : props.price;
    const date = hoverPoint ? hoverPoint.date : props.date;

    // The change is over the range the chart shows, at rest and on hover, so
    // the header always matches the line.
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
