import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  FontWeight,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { getDisplaySymbol } from '../utils';
import {
  calculateAggregationParams,
  calculateGroupingOptions,
  formatColumnValue,
  formatSpreadPercent,
  getDepthRatio,
  getDepthWidth,
  groupOrderBook,
  ORDER_BOOK_AGGREGATED_LEVELS,
  selectDefaultGrouping,
} from './order-book.utils';
import { PerpsOrderBookConfigModal } from './order-book-config-modal';
import { PerpsOrderBookSkeleton } from './order-book-skeleton';
import type {
  OrderBookListCurrency,
  OrderBookListMetric,
  PerpsOrderBookProps,
} from './order-book.types';

const DEPTH_BAR_OPACITY = 0.15;

/**
 * Which side(s) of the ladder are shown. Cycled by the header view toggle:
 * `default` (both sides) -> `buy` (bids only) -> `sell` (asks only).
 */
type OrderBookViewMode = 'default' | 'buy' | 'sell';

const VIEW_ICON_SUCCESS_COLOR = 'var(--color-success-default)';
const VIEW_ICON_ERROR_COLOR = 'var(--color-error-default)';

/**
 * Per-bar colors for the view-toggle glyph (top to bottom): both sides colors
 * the top two bars green (buy) and the bottom two red (sell); buy-only is all
 * green; sell-only is all red.
 */
const VIEW_TOGGLE_BAR_COLORS: Record<
  OrderBookViewMode,
  [string, string, string, string]
> = {
  default: [
    VIEW_ICON_SUCCESS_COLOR,
    VIEW_ICON_SUCCESS_COLOR,
    VIEW_ICON_ERROR_COLOR,
    VIEW_ICON_ERROR_COLOR,
  ],
  buy: [
    VIEW_ICON_SUCCESS_COLOR,
    VIEW_ICON_SUCCESS_COLOR,
    VIEW_ICON_SUCCESS_COLOR,
    VIEW_ICON_SUCCESS_COLOR,
  ],
  sell: [
    VIEW_ICON_ERROR_COLOR,
    VIEW_ICON_ERROR_COLOR,
    VIEW_ICON_ERROR_COLOR,
    VIEW_ICON_ERROR_COLOR,
  ],
};

/** Bar paths for the view-toggle glyph, top (longest) to bottom (shortest). */
const VIEW_TOGGLE_BAR_PATHS = [
  'M3 4h18v2H3z',
  'M3 9h14v2H3z',
  'M3 14h10v2H3z',
  'M3 19h6v2H3z',
] as const;

/**
 * View-toggle glyph: four left-aligned descending bars, styled like the design
 * system `Sort` icon but with four rows. Each bar is colored per the active
 * view so the control doubles as a legend (green = buy, red = sell).
 *
 * @param props - Component props.
 * @param props.mode - Current order-book view mode.
 * @param props.className - Classes controlling the icon size.
 */
const OrderBookViewIcon = ({
  mode,
  className,
}: {
  mode: OrderBookViewMode;
  className?: string;
}) => {
  const colors = VIEW_TOGGLE_BAR_COLORS[mode];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {VIEW_TOGGLE_BAR_PATHS.map((d, index) => (
        <path key={d} d={d} fill={colors[index]} />
      ))}
    </svg>
  );
};

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

  const sideColor = isBid ? TextColor.SuccessDefault : TextColor.ErrorDefault;

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      gap={2}
      className={
        isInteractive
          ? 'relative h-8 shrink-0 cursor-pointer hover:bg-muted'
          : 'relative h-8 shrink-0'
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
        variant={TextVariant.BodyXs}
        fontWeight={FontWeight.Medium}
        color={sideColor}
        className="relative z-10"
        data-testid={`${testId}-price`}
      >
        {formatPerpsFiat(level.price, { ranges: PRICE_RANGES_UNIVERSAL })}
      </Text>
      <Text
        variant={TextVariant.BodyXs}
        fontWeight={FontWeight.Medium}
        color={sideColor}
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
 * page owns the stream lifecycle) and renders asks (top), a compact spread row
 * (middle) and bids (bottom) in a single vertical ladder, with a buy/sell depth
 * ratio beneath. A header control opens a modal for choosing the denomination,
 * value metric and price grouping.
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
  const [viewMode, setViewMode] = useState<OrderBookViewMode>('default');

  // Cycle the ladder view: both sides -> buy (bids) only -> sell (asks) only.
  const handleCycleViewMode = useCallback(() => {
    setViewMode((current) => {
      if (current === 'default') {
        return 'buy';
      }
      if (current === 'buy') {
        return 'sell';
      }
      return 'default';
    });
  }, []);

  const showBids = viewMode !== 'sell';
  const showAsks = viewMode !== 'buy';

  // Raw, full-precision book (shared with the page's top-of-book and slippage).
  // The order entry page owns its lifecycle, so we only read here. Used for the
  // precise mid price, spread readout and grouping-option calculation.
  const { orderBook: rawOrderBook } = usePerpsLiveOrderBook({
    symbol,
    manageStream: false,
    enabled: isOpen,
  });

  const displaySymbol = getDisplaySymbol(symbol);
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
  const {
    orderBook: aggregatedOrderBook,
    isInitialLoading,
    connectionStatus,
    reconnect,
  } = usePerpsLiveOrderBook({
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
    })} (${formatSpreadPercent(spreadPercent)})`;
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

  const hasLadder = Boolean(
    grouped && (grouped.bids.length > 0 || grouped.asks.length > 0),
  );

  // The dedicated aggregated socket has dropped and exhausted its automatic
  // reconnection attempts. Surface a clear message and a manual retry rather
  // than an indefinite "Loading…" or a misleading "No data".
  const hasConnectionError = connectionStatus === 'error';

  // Prefer a ladder-shaped skeleton over a centered "Loading…" label so the
  // panel keeps the same top-anchored structure (and the depth ratio does not
  // jump) when the first book update arrives.
  const showLoadingSkeleton =
    isInitialLoading && !hasConnectionError && !hasLadder;

  const showPlaceholder =
    !showLoadingSkeleton &&
    (hasConnectionError || !aggregatedOrderBook || !grouped || !hasLadder);

  const placeholderMessage = hasConnectionError
    ? t('perpsOrderBookConnectionError')
    : t('perpsOrderBookNoData');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full overflow-hidden bg-default"
      data-testid={dataTestId}
      aria-busy={showLoadingSkeleton || undefined}
    >
      {/* Header: view toggle (left) + settings (right). Negative margins cancel
          the icon inset inside the 32px hit targets so the glyphs line up with
          the ladder/column edges below. */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <button
          type="button"
          onClick={handleCycleViewMode}
          aria-label={t('perpsOrderBookViewToggle')}
          className="inline-flex h-8 w-8 -ml-1 cursor-pointer items-center justify-center rounded-lg bg-transparent p-0 hover:bg-hover active:bg-pressed"
          data-testid={`${dataTestId}-view-toggle`}
        >
          <OrderBookViewIcon mode={viewMode} className="h-6 w-6" />
        </button>
        <ButtonIcon
          iconName={IconName.Setting}
          ariaLabel={t('perpsOrderBookConfigTitle')}
          size={ButtonIconSize.Md}
          type="button"
          onClick={() => setIsConfigOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isConfigOpen}
          aria-controls={configModalId}
          className="-mr-1"
          data-testid={`${dataTestId}-grouping-trigger`}
        />
      </Box>

      {/* Column headers */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={1}
      >
        <Text
          variant={TextVariant.BodyXs}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {t('perpsOrderBookPrice')}
        </Text>
        <Text
          variant={TextVariant.BodyXs}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {`${metricLabel} (${unitLabel})`}
        </Text>
      </Box>

      {/* Ladder */}
      {showLoadingSkeleton && (
        <>
          <span className="sr-only">{t('perpsOrderBookLoading')}</span>
          <PerpsOrderBookSkeleton data-testid={`${dataTestId}-skeleton`} />
        </>
      )}
      {showPlaceholder && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          gap={3}
          className="flex-1"
          padding={4}
          data-testid={
            hasConnectionError ? `${dataTestId}-connection-error` : undefined
          }
        >
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {placeholderMessage}
          </Text>
          {hasConnectionError && (
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={reconnect}
              data-testid={`${dataTestId}-reconnect`}
            >
              {t('perpsOrderBookReconnect')}
            </Button>
          )}
        </Box>
      )}
      {!showLoadingSkeleton && !showPlaceholder && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          paddingLeft={4}
          paddingRight={4}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        >
          {/* Asks (sell) — sit directly above the spread. The ladder is a
              compact block anchored to the top of the panel (fast mode caps the
              book at a few levels per side, so there is nothing to scroll to). */}
          {showAsks && (
            <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
              {reversedAsks.map((level, index) => (
                <OrderBookRow
                  // Key by ladder rank, not price: each row is a positional slot,
                  // so React reuses the same DOM node and updates it in place
                  // across live ticks instead of remounting every update.
                  // eslint-disable-next-line react/no-array-index-key
                  key={`ask-${index}`}
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
          )}

          {/* Spread */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            gap={2}
            className="h-8 shrink-0"
            data-testid={`${dataTestId}-spread`}
          >
            <Text
              variant={TextVariant.BodyXs}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {t('perpsOrderBookSpread')}
            </Text>
            {spreadDisplay && (
              <Text
                variant={TextVariant.BodyXs}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {spreadDisplay}
              </Text>
            )}
          </Box>

          {/* Bids (buy) — sit directly below the spread, completing the block */}
          {showBids && (
            <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
              {grouped.bids.map((level, index) => (
                <OrderBookRow
                  // Key by ladder rank, not price (see asks above): positional
                  // slots reused in place avoid per-tick remounts.
                  // eslint-disable-next-line react/no-array-index-key
                  key={`bid-${index}`}
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
          )}

          {/* Buy/Sell depth ratio — keep with the ladder so it sits under the
              last row instead of being pushed to the panel bottom by flex-1. */}
          {depthRatio && (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={1}
              paddingTop={4}
              paddingBottom={3}
              className="shrink-0"
              data-testid={`${dataTestId}-ratio`}
            >
              <Box
                role="img"
                aria-label={t('perpsOrderBookDepthRatio', [
                  String(depthRatio.buyPercent),
                  String(depthRatio.sellPercent),
                ])}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={1}
                className="w-full"
              >
                <Box
                  className="h-1 rounded-full"
                  style={{
                    width: `${depthRatio.buyPercent}%`,
                    backgroundColor: 'var(--color-success-default)',
                  }}
                />
                <Box
                  className="h-1 rounded-full"
                  style={{
                    width: `${depthRatio.sellPercent}%`,
                    backgroundColor: 'var(--color-error-default)',
                  }}
                />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Row}
                justifyContent={BoxJustifyContent.Between}
                className="w-full"
              >
                <Text
                  variant={TextVariant.BodyXs}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.SuccessDefault}
                >
                  {t('perpsOrderBookBuy', [String(depthRatio.buyPercent)])}
                </Text>
                <Text
                  variant={TextVariant.BodyXs}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.ErrorDefault}
                >
                  {t('perpsOrderBookSell', [String(depthRatio.sellPercent)])}
                </Text>
              </Box>
            </Box>
          )}
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
