import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream/usePerpsLiveOrderBook';
import { OrderBookTable } from './order-book-table';
import type { ExpandableOrderBookProps } from './order-book.types';

const ORDER_BOOK_LEVELS = 20;

/**
 * Grace period before the loading state transitions to "unavailable".
 * The order book channel has no REST fallback -- it relies on WebSocket push.
 * If data hasn't arrived within this window the stream likely isn't active.
 */
const LOADING_TIMEOUT_MS = 5_000;

export const ExpandableOrderBook: React.FC<ExpandableOrderBookProps> = ({
  symbol,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
    symbol,
    levels: ORDER_BOOK_LEVELS,
    manageStream: false,
  });

  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (orderBook || !isInitialLoading) {
      setHasTimedOut(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        setHasTimedOut(true);
        timerRef.current = null;
      }, LOADING_TIMEOUT_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [orderBook, isInitialLoading]);

  const effectiveLoading = isInitialLoading && !hasTimedOut;

  const spreadSummary = useMemo(() => {
    if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
      return null;
    }
    const bestBid = parseFloat(orderBook.bids[0].price);
    const bestAsk = parseFloat(orderBook.asks[0].price);
    const mid = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const spreadPct = mid > 0 ? ((spread / mid) * 100).toFixed(3) : '0';

    return {
      bestBid: formatPerpsFiat(bestBid, { ranges: PRICE_RANGES_UNIVERSAL }),
      bestAsk: formatPerpsFiat(bestAsk, { ranges: PRICE_RANGES_UNIVERSAL }),
      spreadPct,
    };
  }, [orderBook]);

  return (
    <div className="rounded-lg border border-border-muted">
      {/* Toggle header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="cursor-pointer px-3 py-2.5"
        onClick={() => setIsExpanded((prev) => !prev)}
        data-testid="perps-order-book-toggle"
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextDefault}>
          Order Book
        </Text>

        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          {spreadSummary && !isExpanded && (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
            >
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.SuccessDefault}
              >
                {spreadSummary.bestBid}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                /
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.ErrorDefault}
              >
                {spreadSummary.bestAsk}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                ({spreadSummary.spreadPct}%)
              </Text>
            </Box>
          )}
          <Icon
            name={isExpanded ? IconName.ArrowUp : IconName.ArrowDown}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
      </Box>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <OrderBookTable
            orderBook={orderBook}
            symbol={symbol}
            isLoading={effectiveLoading}
          />

          {/* Spread footer */}
          {spreadSummary && (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Center}
              gap={1}
              className="pt-2 mt-2 border-t border-border-muted"
            >
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                Spread:
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextDefault}
              >
                {spreadSummary.spreadPct}%
              </Text>
            </Box>
          )}
        </div>
      )}
    </div>
  );
};
