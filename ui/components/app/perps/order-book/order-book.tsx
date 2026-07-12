import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
  PERPS_FALLBACK_PRICE_DISPLAY,
  PERPS_FALLBACK_DATA_DISPLAY,
} from '../../../../../shared/lib/perps-formatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { getDisplayName } from '../utils';
import {
  calculateAggregationParams,
  calculateGroupingOptions,
  formatColumnValue,
  formatGroupingLabel,
  formatSpreadBps,
  getDepthRatio,
  getDepthWidth,
  groupOrderBook,
  ORDER_BOOK_AGGREGATED_LEVELS,
  selectDefaultGrouping,
} from './order-book.utils';
import { PerpsOrderBookConfigModal } from './order-book-config-modal';
import type {
  OrderBookListCurrency,
  OrderBookListMetric,
  PerpsOrderBookProps,
} from './order-book.types';

const DEPTH_BAR_OPACITY = 0.16;

type OrderBookRowProps = {
  level: OrderBookLevel;
  side: 'bid' | 'ask';
  currency: OrderBookListCurrency;
  metric: OrderBookListMetric;
  maxTotal: number;
  szDecimals?: number;
  onSelectPrice?: (price: string) => void;
  selectPriceLabel?: string;
  testId: string;
};

const OrderBookRow = ({
  level,
  side,
  currency,
  metric,
  maxTotal,
  szDecimals,
  onSelectPrice,
  selectPriceLabel,
  testId,
}: OrderBookRowProps) => {
  const depthWidth = getDepthWidth(level, maxTotal);
  const isBid = side === 'bid';
  const isInteractive = Boolean(onSelectPrice);

  const handleSelect = () => onSelectPrice?.(level.price);
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectPrice?.(level.price);
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      paddingLeft={3}
      paddingRight={3}
      className={
        isInteractive
          ? 'relative py-1 cursor-pointer hover:bg-muted'
          : 'relative py-1'
      }
      data-testid={testId}
      {...(isInteractive && {
        role: 'button',
        tabIndex: 0,
        'aria-label': selectPriceLabel,
        onClick: handleSelect,
        onKeyDown: handleKeyDown,
      })}
    >
      <Box
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0"
        style={{
          width: `${depthWidth}%`,
          backgroundColor: isBid
            ? 'var(--color-success-default)'
            : 'var(--color-error-default)',
          opacity: DEPTH_BAR_OPACITY,
        }}
      />
      <Text
        variant={TextVariant.BodySm}
        color={isBid ? TextColor.SuccessDefault : TextColor.ErrorDefault}
        className="relative z-10"
        data-testid={`${testId}-price`}
      >
        {formatPerpsFiat(level.price, { ranges: PRICE_RANGES_UNIVERSAL })}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="relative z-10"
        data-testid={`${testId}-value`}
      >
        {formatColumnValue(level, currency, metric, szDecimals)}
      </Text>
    </Box>
  );
};

/**
 * PerpsOrderBook - Live bid/ask order book with depth bars.
 *
 * Reads from the shared order-book stream channel (the surrounding order entry
 * page owns the stream lifecycle) and renders asks (top), the current mid price
 * and spread (middle) and bids (bottom) in a single vertical ladder. A trigger
 * in the header opens a modal for choosing the denomination, value metric and
 * price grouping.
 *
 * @param options0 - Component props.
 * @param options0.symbol - Market symbol.
 * @param options0.isOpen - Whether the panel is visible.
 * @param options0.marketPrice - Current market price for grouping options.
 * @param options0.szDecimals - Asset base-size decimal precision.
 * @param options0.onSelectPrice - Called with a level's raw price when a row is tapped.
 * @param options0.'data-testid' - Container test id.
 */
export const PerpsOrderBook = ({
  symbol,
  isOpen,
  marketPrice,
  szDecimals,
  onSelectPrice,
  'data-testid': dataTestId = 'perps-order-book',
}: PerpsOrderBookProps) => {
  const t = useI18nContext();
  const configModalId = `${dataTestId}-config-modal`;
  const [currency, setCurrency] = useState<OrderBookListCurrency>('usd');
  const [metric, setMetric] = useState<OrderBookListMetric>('total');
  const [selectedGrouping, setSelectedGrouping] = useState<number | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Raw, full-precision book (shared with the page's top-of-book and slippage).
  // The order entry page owns its lifecycle, so we only read here. Used for the
  // precise mid price, spread readout and grouping-option calculation.
  const { orderBook: rawOrderBook } = usePerpsLiveOrderBook({
    symbol,
    manageStream: false,
    enabled: isOpen,
  });

  const displaySymbol = getDisplayName(symbol);
  const unitLabel = currency === 'usd' ? 'USD' : displaySymbol;
  const metricLabel =
    metric === 'total' ? t('perpsOrderBookTotal') : t('perpsOrderBookSize');

  // Single source of truth for the mid price: prefer the raw book's own mid (so
  // the displayed mid and grouping options never drift), falling back to the
  // page's market price before the first order-book update arrives. Null when
  // neither is available, so the UI shows the unavailable-price fallback instead
  // of a misleading "$0".
  const midPriceValue = useMemo<number | null>(() => {
    const orderBookMid = Number.parseFloat(rawOrderBook?.midPrice ?? '');
    if (Number.isFinite(orderBookMid) && orderBookMid > 0) {
      return orderBookMid;
    }
    if (typeof marketPrice === 'number' && marketPrice > 0) {
      return marketPrice;
    }
    return null;
  }, [rawOrderBook?.midPrice, marketPrice]);

  const groupingOptions = useMemo(
    () => calculateGroupingOptions(midPriceValue ?? 0),
    [midPriceValue],
  );

  const currentGrouping = useMemo(() => {
    if (
      selectedGrouping !== null &&
      groupingOptions.includes(selectedGrouping)
    ) {
      return selectedGrouping;
    }
    return groupingOptions.length
      ? selectDefaultGrouping(groupingOptions)
      : null;
  }, [selectedGrouping, groupingOptions]);

  // Map the selected grouping to Hyperliquid's server-side aggregation params so
  // a coarse grouping spans the full book depth instead of collapsing the few
  // raw levels into a single bucket (the reason the client-side approach showed
  // only a couple of rows). Mirrors the mobile order book.
  const aggregationParams = useMemo(() => {
    if (!currentGrouping || !midPriceValue) {
      return { nSigFigs: 5 as const };
    }
    return calculateAggregationParams(currentGrouping, midPriceValue);
  }, [currentGrouping, midPriceValue]);

  // Server-aggregated book on its own dedicated channel/subscription (does not
  // disturb the raw channel). This drives the bid/ask ladder rows.
  const { orderBook: aggregatedOrderBook, isInitialLoading } =
    usePerpsLiveOrderBook({
      symbol,
      channel: 'orderBookAggregated',
      enabled: isOpen,
      levels: ORDER_BOOK_AGGREGATED_LEVELS,
      nSigFigs: aggregationParams.nSigFigs,
      mantissa: aggregationParams.mantissa,
    });

  // The stream already aggregated server-side, so pass grouping=null (no
  // client-side re-bucketing); just trim to the display depth and rescale bars.
  const grouped = useMemo(
    () =>
      aggregatedOrderBook
        ? groupOrderBook(
            aggregatedOrderBook,
            null,
            ORDER_BOOK_AGGREGATED_LEVELS,
          )
        : null,
    [aggregatedOrderBook],
  );

  // Asks come lowest-price-first; render highest at the top so the best ask
  // sits directly above the spread row (classic ladder layout).
  const reversedAsks = useMemo(
    () => (grouped ? [...grouped.asks].reverse() : []),
    [grouped],
  );

  const depthRatio = useMemo(
    () => (grouped ? getDepthRatio(grouped.bids, grouped.asks) : null),
    [grouped],
  );

  const spreadDisplay = useMemo(() => {
    if (!rawOrderBook) {
      return null;
    }
    const spread = Number.parseFloat(rawOrderBook.spread);
    const spreadPercent = Number.parseFloat(rawOrderBook.spreadPercentage);
    if (!Number.isFinite(spread) || !Number.isFinite(spreadPercent)) {
      return null;
    }
    return `${formatPerpsFiat(spread, {
      ranges: PRICE_RANGES_UNIVERSAL,
    })} (${formatSpreadBps(spreadPercent)} bps)`;
  }, [rawOrderBook]);

  const handleApplyConfig = useCallback(
    (next: {
      currency: OrderBookListCurrency;
      metric: OrderBookListMetric;
      grouping: number;
    }) => {
      setCurrency(next.currency);
      setMetric(next.metric);
      setSelectedGrouping(next.grouping);
    },
    [],
  );

  const groupingTriggerLabel =
    currentGrouping === null
      ? PERPS_FALLBACK_DATA_DISPLAY
      : formatGroupingLabel(currentGrouping);

  const hasLadder = Boolean(
    grouped && (grouped.bids.length > 0 || grouped.asks.length > 0),
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full overflow-hidden bg-default"
      data-testid={dataTestId}
    >
      {/* Header: grouping trigger */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={3}
        paddingBottom={2}
      >
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isConfigOpen}
          aria-controls={configModalId}
          aria-label={t('perpsOrderBookConfigTitle')}
          onClick={() => setIsConfigOpen(true)}
          className="flex flex-row items-center gap-1 cursor-pointer rounded-md border border-muted px-2 py-0.5 hover:bg-muted"
          data-testid={`${dataTestId}-grouping-trigger`}
        >
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {groupingTriggerLabel}
          </Text>
          <Icon name={IconName.ArrowDown} size={IconSize.Xs} />
        </button>
      </Box>

      {/* Column headers */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={3}
        paddingRight={3}
        paddingBottom={1}
      >
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('perpsOrderBookPrice')}
        </Text>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {`${metricLabel} (${unitLabel})`}
        </Text>
      </Box>

      {/* Ladder */}
      {isInitialLoading || !aggregatedOrderBook || !grouped || !hasLadder ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="flex-1"
          padding={4}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {isInitialLoading
              ? t('perpsOrderBookLoading')
              : t('perpsOrderBookNoData')}
          </Text>
        </Box>
      ) : (
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="flex-1 min-h-0 overflow-hidden"
        >
          {/* Asks (sell) — fills the top half, anchored to the spread */}
          <Box
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.End}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          >
            {reversedAsks.map((level, index) => (
              <OrderBookRow
                // Price-based key keeps React identity stable across live
                // updates; the rank-based testId stays deterministic for E2E.
                key={`ask-${level.price}`}
                level={level}
                side="ask"
                currency={currency}
                metric={metric}
                maxTotal={grouped.maxTotal}
                szDecimals={szDecimals}
                onSelectPrice={onSelectPrice}
                selectPriceLabel={
                  onSelectPrice
                    ? t('perpsOrderBookUsePrice', [
                        formatPerpsFiat(level.price, {
                          ranges: PRICE_RANGES_UNIVERSAL,
                        }),
                      ])
                    : undefined
                }
                testId={`${dataTestId}-ask-row-${index}`}
              />
            ))}
          </Box>

          {/* Spread */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            paddingLeft={3}
            paddingRight={3}
            paddingTop={2}
            paddingBottom={2}
            className="shrink-0"
            data-testid={`${dataTestId}-spread`}
          >
            <Text
              variant={TextVariant.HeadingMd}
              fontWeight={FontWeight.Bold}
              color={TextColor.TextDefault}
              data-testid={`${dataTestId}-mid-price`}
            >
              {midPriceValue === null
                ? PERPS_FALLBACK_PRICE_DISPLAY
                : formatPerpsFiat(midPriceValue, {
                    ranges: PRICE_RANGES_UNIVERSAL,
                  })}
            </Text>
            {spreadDisplay && (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {spreadDisplay}
              </Text>
            )}
          </Box>

          {/* Bids (buy) — fills the bottom half, anchored to the spread */}
          <Box
            flexDirection={BoxFlexDirection.Column}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          >
            {grouped.bids.map((level, index) => (
              <OrderBookRow
                key={`bid-${level.price}`}
                level={level}
                side="bid"
                currency={currency}
                metric={metric}
                maxTotal={grouped.maxTotal}
                szDecimals={szDecimals}
                onSelectPrice={onSelectPrice}
                selectPriceLabel={
                  onSelectPrice
                    ? t('perpsOrderBookUsePrice', [
                        formatPerpsFiat(level.price, {
                          ranges: PRICE_RANGES_UNIVERSAL,
                        }),
                      ])
                    : undefined
                }
                testId={`${dataTestId}-bid-row-${index}`}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Buy/Sell depth ratio */}
      {depthRatio && (
        <Box
          paddingLeft={3}
          paddingRight={3}
          paddingTop={2}
          paddingBottom={3}
          className="shrink-0"
        >
          <Box
            role="img"
            aria-label={t('perpsOrderBookDepthRatio', [
              String(depthRatio.buyPercent),
              String(depthRatio.sellPercent),
            ])}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            className="h-6 w-full overflow-hidden rounded-full"
            data-testid={`${dataTestId}-ratio`}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={1}
              paddingLeft={2}
              paddingRight={2}
              className="h-full"
              style={{
                width: `${depthRatio.buyPercent}%`,
                backgroundColor: 'var(--color-success-muted)',
              }}
            >
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Bold}
                color={TextColor.SuccessDefault}
              >
                B
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.SuccessDefault}
              >
                {`${depthRatio.buyPercent}%`}
              </Text>
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.End}
              gap={1}
              paddingLeft={2}
              paddingRight={2}
              className="h-full"
              style={{
                width: `${depthRatio.sellPercent}%`,
                backgroundColor: 'var(--color-error-muted)',
              }}
            >
              <Text variant={TextVariant.BodyXs} color={TextColor.ErrorDefault}>
                {`${depthRatio.sellPercent}%`}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Bold}
                color={TextColor.ErrorDefault}
              >
                S
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <PerpsOrderBookConfigModal
        isOpen={isConfigOpen}
        id={configModalId}
        baseSymbol={displaySymbol}
        currency={currency}
        metric={metric}
        grouping={currentGrouping}
        groupingOptions={groupingOptions}
        onApply={handleApplyConfig}
        onClose={() => setIsConfigOpen(false)}
        data-testid={`${dataTestId}-config-modal`}
      />
    </Box>
  );
};
