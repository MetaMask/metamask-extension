import React, { useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import type { OrderBookData, OrderBookLevel } from '@metamask/perps-controller';
import { useFormatters } from '../../../../hooks/useFormatters';

const DISPLAY_LEVELS = 12;

type OrderBookRowProps = {
  level: OrderBookLevel;
  side: 'bid' | 'ask';
  maxTotal: number;
  formatPrice: (price: string) => string;
};

const OrderBookRow: React.FC<OrderBookRowProps> = ({
  level,
  side,
  maxTotal,
  formatPrice,
}) => {
  const depthPct = maxTotal > 0 ? (Number(level.total) / maxTotal) * 100 : 0;
  const isBid = side === 'bid';
  const barColor = isBid
    ? 'rgba(125, 214, 100, 0.15)'
    : 'rgba(255, 90, 90, 0.15)';
  const priceColor = isBid
    ? TextColor.SuccessDefault
    : TextColor.ErrorDefault;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 8px',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Depth bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${depthPct}%`,
          background: barColor,
          pointerEvents: 'none',
        }}
      />
      <Text
        variant={TextVariant.BodySm}
        color={priceColor}
        fontWeight={FontWeight.Medium}
        style={{ minWidth: '80px', textAlign: 'left', position: 'relative' }}
      >
        {formatPrice(level.price)}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        style={{ minWidth: '70px', textAlign: 'right', position: 'relative' }}
      >
        {Number(level.size).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        })}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        style={{ minWidth: '80px', textAlign: 'right', position: 'relative' }}
      >
        {Number(level.notional).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}
      </Text>
    </div>
  );
};

export type PerpsOrderBookProps = {
  orderBook: OrderBookData | null;
  isLoading?: boolean;
};

const ColumnHeaders: React.FC = () => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Between}
    style={{ padding: '4px 8px 6px', flexShrink: 0 } as React.CSSProperties}
  >
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      style={{ minWidth: '80px' }}
    >
      Price
    </Text>
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      style={{ minWidth: '70px', textAlign: 'right' }}
    >
      Size
    </Text>
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      style={{ minWidth: '80px', textAlign: 'right' }}
    >
      Total (USD)
    </Text>
  </Box>
);

/**
 * PerpsOrderBook – simple bid/ask ladder for the expanded trading view.
 *
 * Renders up to DISPLAY_LEVELS rows per side, a spread row in the middle,
 * and cumulative depth bars behind each row.
 */
export const PerpsOrderBook: React.FC<PerpsOrderBookProps> = ({
  orderBook,
  isLoading = false,
}) => {
  const { formatCurrencyWithMinThreshold } = useFormatters();

  const formatPrice = (price: string) =>
    formatCurrencyWithMinThreshold(Number(price), 'USD');

  const maxTotal = useMemo(
    () => (orderBook ? Number(orderBook.maxTotal) : 0),
    [orderBook],
  );

  // Asks come in lowest-first; reverse so lowest ask is nearest the spread row.
  const visibleAsks = useMemo(() => {
    if (!orderBook) {
      return [];
    }
    return [...orderBook.asks].slice(0, DISPLAY_LEVELS).reverse();
  }, [orderBook]);

  const visibleBids = useMemo(() => {
    if (!orderBook) {
      return [];
    }
    return orderBook.bids.slice(0, DISPLAY_LEVELS);
  }, [orderBook]);

  if (isLoading || !orderBook) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        style={{ height: '100%', overflow: 'hidden' } as React.CSSProperties}
      >
        <ColumnHeaders />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          style={{ flex: 1 } as React.CSSProperties}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {isLoading ? 'Loading…' : 'No data'}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      style={
        { height: '100%', overflow: 'hidden', userSelect: 'none' } as React.CSSProperties
      }
    >
      <ColumnHeaders />

      {/* Asks (red) — lowest ask nearest the spread */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        style={{ flexShrink: 0 } as React.CSSProperties}
      >
        {visibleAsks.map((level) => (
          <OrderBookRow
            key={`ask-${level.price}`}
            level={level}
            side="ask"
            maxTotal={maxTotal}
            formatPrice={formatPrice}
          />
        ))}
      </Box>

      {/* Spread row */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        style={
          {
            padding: '5px 8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          } as React.CSSProperties
        }
      >
        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.TextAlternative}
          fontWeight={FontWeight.Medium}
        >
          Spread
        </Text>
        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Medium}
        >
          {formatPrice(orderBook.spread)}{' '}
          {`(${Number(orderBook.spreadPercentage).toFixed(3)}%)`}
        </Text>
      </Box>

      {/* Bids (green) */}
      <Box
        flexDirection={BoxFlexDirection.Column}
        style={{ flexShrink: 0 } as React.CSSProperties}
      >
        {visibleBids.map((level) => (
          <OrderBookRow
            key={`bid-${level.price}`}
            level={level}
            side="bid"
            maxTotal={maxTotal}
            formatPrice={formatPrice}
          />
        ))}
      </Box>

      {/* Mid price footer */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        style={
          {
            padding: '6px 8px',
            marginTop: 'auto',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          } as React.CSSProperties
        }
      >
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          Mid{' '}
        </Text>
        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.TextDefault}
          fontWeight={FontWeight.Medium}
        >
          {formatPrice(orderBook.midPrice)}
        </Text>
      </Box>
    </Box>
  );
};
