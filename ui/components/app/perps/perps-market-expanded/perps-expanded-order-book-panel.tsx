import React from 'react';
import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  Skeleton,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { formatPerpsFiatUniversal } from '../utils/formatPerpsDisplayPrice';

/** Number of price levels rendered per side. */
const ORDER_BOOK_LEVELS = 11;

type OrderBookRowsProps = {
  levels: OrderBookLevel[];
  maxTotal: number;
  side: 'bid' | 'ask';
};

const OrderBookRows = ({ levels, maxTotal, side }: OrderBookRowsProps) => {
  const priceColor =
    side === 'bid' ? TextColor.SuccessDefault : TextColor.ErrorDefault;
  const depthColor =
    side === 'bid' ? 'rgba(40, 167, 69, 0.12)' : 'rgba(220, 53, 69, 0.12)';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid={`perps-order-book-${side}s`}
    >
      {levels.map((level) => {
        const total = parseFloat(level.total);
        const depthPct =
          maxTotal > 0 ? Math.min(100, (total / maxTotal) * 100) : 0;
        return (
          <Box
            key={`${side}-${level.price}`}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            className="relative px-3 py-0.5"
          >
            <Box
              className="absolute inset-y-0 right-0"
              style={{ width: `${depthPct}%`, backgroundColor: depthColor }}
            />
            <Text
              variant={TextVariant.BodyXs}
              color={priceColor}
              className="z-10 tabular-nums"
            >
              {formatPerpsFiatUniversal(level.price)}
            </Text>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              className="z-10 tabular-nums"
            >
              {level.size}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export type PerpsExpandedOrderBookPanelProps = {
  /** Market symbol whose order book is shown. */
  symbol: string;
};

/**
 * Order book panel for the expanded perps view.
 *
 * Owns the high-frequency order-book stream subscription locally so book ticks
 * re-render only this panel, never the chart or trade ticket.
 */
export const PerpsExpandedOrderBookPanel = React.memo(
  ({ symbol }: PerpsExpandedOrderBookPanelProps) => {
    const t = useI18nContext();
    const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
      symbol,
      levels: ORDER_BOOK_LEVELS,
    });

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 min-w-0 overflow-hidden border-r border-muted"
        data-testid="perps-expanded-order-book-panel"
      >
        <Box paddingLeft={3} paddingRight={3} paddingTop={3} paddingBottom={2}>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('perpsOrderBook')}
          </Text>
        </Box>
        {isInitialLoading || !orderBook ? (
          <Box
            paddingLeft={3}
            paddingRight={3}
            flexDirection={BoxFlexDirection.Column}
            gap={1}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </Box>
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <OrderBookRows
              levels={orderBook.asks.slice(0, ORDER_BOOK_LEVELS).reverse()}
              maxTotal={parseFloat(orderBook.maxTotal)}
              side="ask"
            />
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              className="border-y border-muted px-3 py-1"
              data-testid="perps-order-book-spread"
            >
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                {t('perpsOrderBookSpread')}
              </Text>
              <Text variant={TextVariant.BodyXs} className="tabular-nums">
                {orderBook.spread}
              </Text>
            </Box>
            <OrderBookRows
              levels={orderBook.bids.slice(0, ORDER_BOOK_LEVELS)}
              maxTotal={parseFloat(orderBook.maxTotal)}
              side="bid"
            />
          </Box>
        )}
      </Box>
    );
  },
);

PerpsExpandedOrderBookPanel.displayName = 'PerpsExpandedOrderBookPanel';
