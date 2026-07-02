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
import type { OrderBookTableProps, OrderBookGrouping } from './order-book.types';

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

function groupLevels(
  levels: OrderBookLevel[],
  grouping: OrderBookGrouping,
  side: 'bid' | 'ask',
): OrderBookLevel[] {
  if (levels.length === 0) {
    return [];
  }

  const grouped = new Map<number, OrderBookLevel>();

  for (const level of levels) {
    const price = parseFloat(level.price);
    const bucketPrice =
      side === 'bid'
        ? Math.floor(price / grouping) * grouping
        : Math.ceil(price / grouping) * grouping;

    const existing = grouped.get(bucketPrice);
    if (existing) {
      const newSize = parseFloat(existing.size) + parseFloat(level.size);
      const newNotional =
        parseFloat(existing.totalNotional) + parseFloat(level.notional);
      grouped.set(bucketPrice, {
        price: bucketPrice.toString(),
        size: newSize.toString(),
        total: newSize.toString(),
        notional: parseFloat(level.notional).toString(),
        totalNotional: newNotional.toString(),
      });
    } else {
      grouped.set(bucketPrice, {
        price: bucketPrice.toString(),
        size: level.size,
        total: level.size,
        notional: level.notional,
        totalNotional: level.notional,
      });
    }
  }

  const result = Array.from(grouped.values());

  let runningTotal = 0;
  let runningNotional = 0;
  for (const level of result) {
    runningTotal += parseFloat(level.size);
    runningNotional += parseFloat(level.totalNotional);
    level.total = runningTotal.toString();
    level.totalNotional = runningNotional.toString();
  }

  return result;
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
  grouping,
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
    const levels = grouping
      ? groupLevels(orderBook.asks, grouping, 'ask')
      : orderBook.asks;
    return [...levels].reverse().map((level, index) => renderRow(level, index, 'ask'));
  }, [orderBook?.asks, grouping, renderRow]);

  const bidRows = useMemo(() => {
    if (!orderBook?.bids) {
      return null;
    }
    const levels = grouping
      ? groupLevels(orderBook.bids, grouping, 'bid')
      : orderBook.bids;
    return levels.map((level, index) => renderRow(level, index, 'bid'));
  }, [orderBook?.bids, grouping, renderRow]);

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
