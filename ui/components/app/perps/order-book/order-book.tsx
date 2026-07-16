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
import { getDisplayName } from '../utils';
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

/**
 * Icon tint for the view toggle, hinting the active side: green for buy-only,
 * red for sell-only, default color for both sides.
 */
const VIEW_TOGGLE_ICON_CLASS: Record<OrderBookViewMode, string | undefined> = {
  default: undefined,
  buy: 'text-success-default',
  sell: 'text-error-default',
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
      paddingLeft={2}
      paddingRight={4}
      className={
        isInteractive
          ? 'relative h-8 cursor-pointer hover:bg-muted'
          : 'relative h-8'
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

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full overflow-hidden bg-default"
      data-testid={dataTestId}
    >
      {/* Header: view toggle (left) + settings (right) */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={2}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={2}
      >
        <ButtonIcon
          iconName={IconName.Sort}
          ariaLabel={t('perpsOrderBookViewToggle')}
          size={ButtonIconSize.Md}
          onClick={handleCycleViewMode}
          iconProps={{ className: VIEW_TOGGLE_ICON_CLASS[viewMode] }}
          data-testid={`${dataTestId}-view-toggle`}
        />
        <ButtonIcon
          iconName={IconName.Setting}
          ariaLabel={t('perpsOrderBookConfigTitle')}
          size={ButtonIconSize.Md}
          onClick={() => setIsConfigOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isConfigOpen}
          aria-controls={configModalId}
          data-testid={`${dataTestId}-grouping-trigger`}
        />
      </Box>

      {/* Column headers */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={2}
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
          {showAsks && (
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
          )}

          {/* Spread */}
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Between}
            gap={2}
            paddingLeft={2}
            paddingRight={4}
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

          {/* Bids (buy) — fills the bottom half, anchored to the spread */}
          {showBids && (
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
          )}
        </Box>
      )}

      {/* Buy/Sell depth ratio */}
      {depthRatio && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          paddingLeft={2}
          paddingRight={4}
          paddingTop={2}
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
