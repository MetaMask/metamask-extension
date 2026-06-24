import React, { useMemo, useCallback } from 'react';
import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
} from '@metamask/design-system-react';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import type { OrderBookTableProps } from './order-book.types';

function formatTotal(level: OrderBookLevel): string {
  const value = parseFloat(level.totalNotional);
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL });
}

function formatPrice(price: string): string {
  return formatPerpsFiat(parseFloat(price), {
    ranges: PRICE_RANGES_UNIVERSAL,
  });
}

function getDepthBarWidth(level: OrderBookLevel, maxTotal: string): number {
  const max = parseFloat(maxTotal);
  if (max === 0) {
    return 0;
  }
  return (parseFloat(level.total) / max) * 100;
}

export const OrderBookTable: React.FC<OrderBookTableProps> = ({
  orderBook,
  symbol,
  isLoading = false,
}) => {
  const renderRow = useCallback(
    (
      level: OrderBookLevel,
      index: number,
      side: 'bid' | 'ask',
    ) => {
      const depthWidth = orderBook
        ? getDepthBarWidth(level, orderBook.maxTotal)
        : 0;
      const isBid = side === 'bid';
      const depthPosition = 'right-0';
      const depthColor = isBid ? 'bg-success-default' : 'bg-error-default';
      const priceColor = isBid
        ? TextColor.SuccessDefault
        : TextColor.ErrorDefault;

      return (
        <div
          key={`${side}-${level.price}`}
          className="relative flex flex-row py-0.5"
          data-testid={`perps-order-book-${side}-row-${index}`}
        >
          <div
            className={`absolute inset-y-0 ${depthPosition} ${depthColor} opacity-15`}
            style={{ width: `${depthWidth}%` }}
          />
          <div className="z-[1] flex-1">
            <Text variant={TextVariant.BodyXs} color={priceColor}>
              {formatPrice(level.price)}
            </Text>
          </div>
          <div className="z-[1] flex-1 text-right">
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {formatTotal(level)}
            </Text>
          </div>
        </div>
      );
    },
    [orderBook],
  );

  const askRows = useMemo(() => {
    if (!orderBook?.asks) {
      return null;
    }
    return [...orderBook.asks].reverse().map((level, index) => renderRow(level, index, 'ask'));
  }, [orderBook?.asks, renderRow]);

  const bidRows = useMemo(() => {
    if (!orderBook?.bids) {
      return null;
    }
    return orderBook.bids.map((level, index) => renderRow(level, index, 'bid'));
  }, [orderBook?.bids, renderRow]);

  if (!orderBook) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        className="justify-center py-6"
        data-testid="perps-order-book-empty"
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {isLoading ? 'Loading order book...' : 'Order book unavailable'}
        </Text>
      </Box>
    );
  }

  return (
    <div data-testid="perps-order-book-table">
      {/* Column headers */}
      <div className="flex flex-row pb-1 border-b border-border-muted">
        <div className="flex-1">
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            Price
          </Text>
        </div>
        <div className="flex-1 text-right">
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            Total (USD)
          </Text>
        </div>
      </div>

      {/* Asks (top, reversed so lowest ask is near the spread) */}
      <div>{askRows}</div>

      {/* Spread divider */}
      <div className="border-b border-border-muted my-1" />

      {/* Bids (bottom, highest bid first) */}
      <div>{bidRows}</div>
    </div>
  );
};
