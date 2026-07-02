import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Text,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream/usePerpsLiveOrderBook';
import { OrderBookTable } from './order-book-table';
import type {
  ExpandableOrderBookProps,
  OrderBookToggleProps,
  OrderBookPanelProps,
  OrderBookGrouping,
} from './order-book.types';

const ORDER_BOOK_LEVELS = 20;

/**
 * Grace period before the loading state transitions to "unavailable".
 * The order book channel has no REST fallback -- it relies on WebSocket push.
 * If data hasn't arrived within this window the stream likely isn't active.
 */
const LOADING_TIMEOUT_MS = 5_000;

const OrderBookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M9.5 5.331H7.831V7H6.165V17h1.667v1.668H9.5V17h1.668V7H9.499zm0 10.003H7.831V8.666H9.5zM17.835 8.666h-1.667V5.33H14.5v3.335h-1.667V14.5H14.5v4.168h1.667V14.5h1.667zm-1.667 4.168H14.5v-2.501h1.667z" />
  </svg>
);

export const OrderBookToggle: React.FC<OrderBookToggleProps> = ({
  isExpanded,
  onToggle,
}) => (
  <button
    type="button"
    className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-solid ${
      isExpanded
        ? 'border-primary-default text-[var(--color-primary-inverse)]'
        : 'border-border-muted text-text-default hover:text-text-alternative'
    }`}
    onClick={onToggle}
    data-testid="perps-order-book-toggle"
    aria-label="Toggle order book"
    aria-expanded={isExpanded}
  >
    <OrderBookIcon className="w-6 h-6" />
  </button>
);

const GROUPING_OPTIONS: OrderBookGrouping[] = [0.1, 1, 10, 100, 1000];

function formatGroupingLabel(value: OrderBookGrouping): string {
  if (value >= 1000) {
    return '1,000';
  }
  return value.toString();
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ symbol }) => {
  const [grouping, setGrouping] = useState<OrderBookGrouping>(1);

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

  return (
    <div
      className="rounded-lg border border-border-muted px-3 pb-3 pt-2 h-full overflow-y-auto"
      data-testid="perps-order-book-panel"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        className="pb-2 mb-2 border-b border-border-muted"
      >
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          Group by
        </Text>
        <select
          value={grouping}
          onChange={(e) =>
            setGrouping(parseFloat(e.target.value) as OrderBookGrouping)
          }
          className="bg-background-default text-text-default text-xs border border-border-muted rounded px-2 py-1 cursor-pointer"
          data-testid="perps-order-book-grouping-select"
        >
          {GROUPING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {formatGroupingLabel(opt)}
            </option>
          ))}
        </select>
      </Box>

      <OrderBookTable
        orderBook={orderBook}
        symbol={symbol}
        isLoading={effectiveLoading}
        grouping={grouping}
      />
    </div>
  );
};

export const ExpandableOrderBook: React.FC<ExpandableOrderBookProps> = ({
  symbol,
  onExpandChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      onExpandChange?.(next);
      return next;
    });
  }, [onExpandChange]);

  return (
    <div className="flex flex-col items-end">
      <OrderBookToggle isExpanded={isExpanded} onToggle={handleToggle} />

      {isExpanded && (
        <div className="mt-2 w-full">
          <OrderBookPanel symbol={symbol} />
        </div>
      )}
    </div>
  );
};
