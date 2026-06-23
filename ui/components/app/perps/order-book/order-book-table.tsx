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
  const renderBidRow = useCallback(
    (level: OrderBookLevel, index: number) => {
      const depthWidth = orderBook
        ? getDepthBarWidth(level, orderBook.maxTotal)
        : 0;

      return (
        <div
          key={`bid-${level.price}`}
          className="relative flex flex-row py-0.5"
          data-testid={`perps-order-book-bid-row-${index}`}
        >
          <div
            className="absolute inset-y-0 right-0 bg-success-default opacity-15"
            style={{ width: `${depthWidth}%` }}
          />
          <div className="z-[1] flex-1">
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {formatTotal(level)}
            </Text>
          </div>
          <div className="z-[1] flex-1 text-right pr-2">
            <Text variant={TextVariant.BodyXs} color={TextColor.SuccessDefault}>
              {formatPrice(level.price)}
            </Text>
          </div>
        </div>
      );
    },
    [orderBook],
  );

  const renderAskRow = useCallback(
    (level: OrderBookLevel, index: number) => {
      const depthWidth = orderBook
        ? getDepthBarWidth(level, orderBook.maxTotal)
        : 0;

      return (
        <div
          key={`ask-${level.price}`}
          className="relative flex flex-row py-0.5"
          data-testid={`perps-order-book-ask-row-${index}`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-error-default opacity-15"
            style={{ width: `${depthWidth}%` }}
          />
          <div className="z-[1] flex-1 pl-2">
            <Text variant={TextVariant.BodyXs} color={TextColor.ErrorDefault}>
              {formatPrice(level.price)}
            </Text>
          </div>
          <div className="z-[1] flex-1 text-right">
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {formatTotal(level)}
            </Text>
          </div>
        </div>
      );
    },
    [orderBook],
  );

  const bidRows = useMemo(() => {
    if (!orderBook?.bids) {
      return null;
    }
    return orderBook.bids.map((level, index) => renderBidRow(level, index));
  }, [orderBook?.bids, renderBidRow]);

  const askRows = useMemo(() => {
    if (!orderBook?.asks) {
      return null;
    }
    return orderBook.asks.map((level, index) => renderAskRow(level, index));
  }, [orderBook?.asks, renderAskRow]);

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
            Total (USD)
          </Text>
        </div>
        <div className="flex-1 text-right pr-2">
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            Bid
          </Text>
        </div>
        <div className="flex-1 pl-2">
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            Ask
          </Text>
        </div>
        <div className="flex-1 text-right">
          <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
            Total (USD)
          </Text>
        </div>
      </div>

      {/* Split bid/ask view */}
      <div className="flex flex-row">
        <div className="flex-1">{bidRows}</div>
        <div className="flex-1">{askRows}</div>
      </div>
    </div>
  );
};
