import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonBase,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { OrderBookData, OrderBookLevel } from '@metamask/perps-controller';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const MIN_ROW_HEIGHT = 28;
const FIXED_HEIGHT_FALLBACK = 108;
const MIN_ROWS_PER_SIDE = 4;

export type OrderBookPriceClick = {
  price: string;
  side: 'bid' | 'ask';
};

type OrderBookRowProps = {
  level?: OrderBookLevel;
  side: 'bid' | 'ask';
  maxTotal: number;
  rowHeight: number;
  formatPrice: (price: string) => string;
  onPriceClick?: (priceClick: OrderBookPriceClick) => void;
};

const OrderBookRow: React.FC<OrderBookRowProps> = ({
  level,
  side,
  maxTotal,
  rowHeight,
  formatPrice,
  onPriceClick,
}) => {
  const isBid = side === 'bid';
  const depthPct =
    level && maxTotal > 0 ? (Number(level.total) / maxTotal) * 100 : 0;
  const priceColor = isBid ? TextColor.SuccessDefault : TextColor.ErrorDefault;
  const barColor = isBid
    ? 'rgba(125, 214, 100, 0.15)'
    : 'rgba(255, 90, 90, 0.15)';

  if (!level) {
    return (
      <Box
        className="shrink-0 px-2"
        style={{ height: rowHeight }}
        data-testid={`perps-order-book-placeholder-${side}`}
      />
    );
  }

  return (
    <ButtonBase
      type="button"
      className="relative min-w-0 shrink-0 justify-start overflow-hidden rounded-none bg-transparent px-2 py-0 hover:bg-hover active:bg-pressed"
      style={{ height: rowHeight }}
      onClick={() => onPriceClick?.({ price: level.price, side })}
      data-testid={`perps-order-book-row-${side}-${level.price}`}
      isFullWidth
    >
      <Box
        className="absolute bottom-0 right-0 top-0 pointer-events-none"
        style={{ width: `${depthPct}%`, background: barColor }}
      />
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        className="relative min-w-0 flex-1"
      >
        <Text
          variant={TextVariant.BodySm}
          color={priceColor}
          fontWeight={FontWeight.Medium}
          className="min-w-[80px]"
        >
          {formatPrice(level.price)}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextDefault}
          className="min-w-[70px] text-right"
        >
          {Number(level.size).toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="min-w-[80px] text-right"
        >
          {Number(level.notional).toLocaleString(undefined, {
            maximumFractionDigits: 0,
          })}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export type PerpsOrderBookProps = {
  orderBook: OrderBookData | null;
  isLoading?: boolean;
  onPriceClick?: (priceClick: OrderBookPriceClick) => void;
};

const ColumnHeaders = React.forwardRef<HTMLDivElement>((_props, ref) => (
  <Box
    ref={ref}
    flexDirection={BoxFlexDirection.Row}
    justifyContent={BoxJustifyContent.Between}
    className="shrink-0 px-2 py-2"
  >
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      className="min-w-[80px]"
    >
      Price
    </Text>
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      className="min-w-[70px] text-right"
    >
      Size
    </Text>
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      className="min-w-[80px] text-right"
    >
      Total (USD)
    </Text>
  </Box>
));

ColumnHeaders.displayName = 'ColumnHeaders';

const buildRows = (
  levels: OrderBookLevel[],
  rowCount: number,
  side: 'bid' | 'ask',
) => {
  const visibleLevels =
    side === 'ask'
      ? [...levels].slice(0, rowCount).reverse()
      : levels.slice(0, rowCount);
  const placeholders = Array.from<undefined>({
    length: Math.max(rowCount - visibleLevels.length, 0),
  });

  return side === 'ask'
    ? [...placeholders, ...visibleLevels]
    : [...visibleLevels, ...placeholders];
};

/**
 * Adaptive bid/ask ladder for the expanded trading view.
 *
 * @param options0 - Component props.
 * @param options0.orderBook - Latest order book snapshot.
 * @param options0.isLoading - Whether the order book is loading.
 * @param options0.onPriceClick - Called when a price level is clicked.
 */
export const PerpsOrderBook: React.FC<PerpsOrderBookProps> = ({
  orderBook,
  isLoading = false,
  onPriceClick,
}) => {
  const t = useI18nContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const measuredContainerHeightRef = useRef(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [fixedHeight, setFixedHeight] = useState(FIXED_HEIGHT_FALLBACK);
  const { formatCurrencyWithMinThreshold } = useFormatters();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updateLayout = (height?: number) => {
      const nextAvailableHeight =
        height ||
        measuredContainerHeightRef.current ||
        container.getBoundingClientRect().height;
      measuredContainerHeightRef.current = nextAvailableHeight;

      const measuredFixedHeight =
        (headerRef.current?.getBoundingClientRect().height ?? 0) +
        (spreadRef.current?.getBoundingClientRect().height ?? 0) +
        (footerRef.current?.getBoundingClientRect().height ?? 0);

      setAvailableHeight(nextAvailableHeight);
      setFixedHeight(
        measuredFixedHeight > 0
          ? Math.ceil(measuredFixedHeight)
          : FIXED_HEIGHT_FALLBACK,
      );
    };

    updateLayout(container.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const containerEntry = entries.find(
        (entry) => entry.target === container,
      );
      const hasEntryTargets = entries.some((entry) => entry.target);
      const testEnvironmentHeight = hasEntryTargets
        ? undefined
        : entries[0]?.contentRect.height;

      updateLayout(containerEntry?.contentRect.height ?? testEnvironmentHeight);
    });

    observer.observe(container);
    if (headerRef.current) {
      observer.observe(headerRef.current);
    }
    if (spreadRef.current) {
      observer.observe(spreadRef.current);
    }
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, orderBook]);

  const rowMetrics = useMemo(() => {
    const measuredHeight =
      availableHeight || containerRef.current?.getBoundingClientRect().height;
    if (!measuredHeight) {
      return {
        rowCountPerSide: 12,
        rowHeight: MIN_ROW_HEIGHT,
      };
    }
    const availableRowHeight = Math.max(measuredHeight - fixedHeight, 0);
    const rows = Math.floor(availableRowHeight / MIN_ROW_HEIGHT / 2);
    const rowCountPerSide = Math.max(rows, MIN_ROWS_PER_SIDE);

    return {
      rowCountPerSide,
      rowHeight: Math.max(
        availableRowHeight / rowCountPerSide / 2,
        MIN_ROW_HEIGHT,
      ),
    };
  }, [availableHeight, fixedHeight]);

  const formatPrice = (price: string) =>
    formatCurrencyWithMinThreshold(Number(price), 'USD');

  const maxTotal = useMemo(
    () => (orderBook ? Number(orderBook.maxTotal) : 0),
    [orderBook],
  );

  const visibleAsks = useMemo(
    () => buildRows(orderBook?.asks ?? [], rowMetrics.rowCountPerSide, 'ask'),
    [orderBook?.asks, rowMetrics.rowCountPerSide],
  );
  const visibleBids = useMemo(
    () => buildRows(orderBook?.bids ?? [], rowMetrics.rowCountPerSide, 'bid'),
    [orderBook?.bids, rowMetrics.rowCountPerSide],
  );

  return (
    <Box
      ref={containerRef}
      flexDirection={BoxFlexDirection.Column}
      className="h-full min-h-0 select-none overflow-hidden"
      data-testid="perps-order-book"
    >
      <ColumnHeaders ref={headerRef} />

      {isLoading || !orderBook ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="min-h-0 flex-1"
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {isLoading ? t('loading') : t('perpsNoMarketsFound')}
          </Text>
        </Box>
      ) : (
        <>
          <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
            {visibleAsks.map((level, index) => (
              <OrderBookRow
                key={level ? `ask-${level.price}` : `ask-placeholder-${index}`}
                level={level}
                side="ask"
                maxTotal={maxTotal}
                rowHeight={rowMetrics.rowHeight}
                formatPrice={formatPrice}
                onPriceClick={onPriceClick}
              />
            ))}
          </Box>

          <Box
            ref={spreadRef}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Between}
            alignItems={BoxAlignItems.Center}
            className="shrink-0 border-y border-border-muted px-2 py-1.5"
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

          <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
            {visibleBids.map((level, index) => (
              <OrderBookRow
                key={level ? `bid-${level.price}` : `bid-placeholder-${index}`}
                level={level}
                side="bid"
                maxTotal={maxTotal}
                rowHeight={rowMetrics.rowHeight}
                formatPrice={formatPrice}
                onPriceClick={onPriceClick}
              />
            ))}
          </Box>

          <Box
            ref={footerRef}
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className="shrink-0 border-t border-border-muted px-2 py-2"
          >
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {t('perpsMid')}
            </Text>
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextDefault}
              fontWeight={FontWeight.Medium}
            >
              {formatPrice(orderBook.midPrice)}
            </Text>
          </Box>
        </>
      )}
    </Box>
  );
};
