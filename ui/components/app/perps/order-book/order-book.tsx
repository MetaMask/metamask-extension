import React, { useCallback, useMemo, useState } from 'react';
import {
  twMerge,
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
} from '../../../../../shared/lib/perps-formatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { getDisplayName } from '../utils';
import {
  calculateGroupingOptions,
  formatColumnValue,
  formatGroupingLabel,
  getDepthRatio,
  getDepthWidth,
  groupOrderBook,
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
  testId: string;
};

const OrderBookRow = ({
  level,
  side,
  currency,
  metric,
  maxTotal,
  testId,
}: OrderBookRowProps) => {
  const depthWidth = getDepthWidth(level, maxTotal);
  const isBid = side === 'bid';

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      paddingLeft={3}
      paddingRight={3}
      className="relative py-1"
      data-testid={testId}
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
      >
        {formatPerpsFiat(level.price, { ranges: PRICE_RANGES_UNIVERSAL })}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextDefault}
        className="relative z-10"
      >
        {formatColumnValue(level, currency, metric)}
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
 * @param options0.'data-testid' - Container test id.
 */
export const PerpsOrderBook = ({
  symbol,
  isOpen,
  marketPrice,
  'data-testid': dataTestId = 'perps-order-book',
}: PerpsOrderBookProps) => {
  const t = useI18nContext();
  const [currency, setCurrency] = useState<OrderBookListCurrency>('usd');
  const [metric, setMetric] = useState<OrderBookListMetric>('total');
  const [selectedGrouping, setSelectedGrouping] = useState<number | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // The order entry page already activates/deactivates the background
  // order-book stream, so we only read from the shared channel here.
  const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
    symbol,
    manageStream: false,
    enabled: isOpen,
  });

  const displaySymbol = getDisplayName(symbol);
  const unitLabel = currency === 'usd' ? 'USD' : displaySymbol;
  const metricLabel =
    metric === 'total' ? t('perpsOrderBookTotal') : t('perpsOrderBookSize');

  const midPriceValue = useMemo(() => {
    if (Number.isFinite(marketPrice) && (marketPrice as number) > 0) {
      return marketPrice as number;
    }
    const parsed = Number.parseFloat(orderBook?.midPrice ?? '');
    return Number.isFinite(parsed) ? parsed : 0;
  }, [marketPrice, orderBook?.midPrice]);

  const groupingOptions = useMemo(
    () => calculateGroupingOptions(midPriceValue),
    [midPriceValue],
  );

  const currentGrouping = useMemo(() => {
    if (selectedGrouping !== null && groupingOptions.includes(selectedGrouping)) {
      return selectedGrouping;
    }
    return groupingOptions.length ? selectDefaultGrouping(groupingOptions) : null;
  }, [selectedGrouping, groupingOptions]);

  const grouped = useMemo(
    () => (orderBook ? groupOrderBook(orderBook, currentGrouping) : null),
    [orderBook, currentGrouping],
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
    if (!orderBook) {
      return null;
    }
    const spread = Number.parseFloat(orderBook.spread);
    const spreadPercent = Number.parseFloat(orderBook.spreadPercentage);
    if (!Number.isFinite(spread) || !Number.isFinite(spreadPercent)) {
      return null;
    }
    const bps = spreadPercent * 100;
    return `${formatPerpsFiat(spread, {
      ranges: PRICE_RANGES_UNIVERSAL,
    })} (${bps.toFixed(1)} bps)`;
  }, [orderBook]);

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
    currentGrouping === null ? '—' : formatGroupingLabel(currentGrouping);

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
        <Box
          role="button"
          tabIndex={0}
          aria-haspopup="dialog"
          aria-label={t('perpsOrderBookConfigTitle')}
          onClick={() => setIsConfigOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setIsConfigOpen(true);
            }
          }}
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="cursor-pointer rounded-md px-1 py-0.5 hover:bg-muted"
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
        </Box>
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
      {isInitialLoading || !orderBook || !grouped ? (
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
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Asks (sell) */}
          <Box flexDirection={BoxFlexDirection.Column}>
            {reversedAsks.map((level, index) => (
              <OrderBookRow
                key={`ask-${level.price}`}
                level={level}
                side="ask"
                currency={currency}
                metric={metric}
                maxTotal={grouped.maxTotal}
                testId={`${dataTestId}-ask-${index}`}
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
            data-testid={`${dataTestId}-spread`}
          >
            <Text
              variant={TextVariant.HeadingMd}
              fontWeight={FontWeight.Bold}
              color={TextColor.SuccessDefault}
            >
              {formatPerpsFiat(orderBook.midPrice, {
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

          {/* Bids (buy) */}
          <Box flexDirection={BoxFlexDirection.Column}>
            {grouped.bids.map((level, index) => (
              <OrderBookRow
                key={`bid-${level.price}`}
                level={level}
                side="bid"
                currency={currency}
                metric={metric}
                maxTotal={grouped.maxTotal}
                testId={`${dataTestId}-bid-${index}`}
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
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.ErrorDefault}
              >
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
