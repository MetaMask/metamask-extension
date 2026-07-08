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
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconColor,
} from '@metamask/design-system-react';
import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  formatPerpsFiat,
  formatLargeNumber,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveOrderBook } from '../../../../hooks/perps/stream';
import { getDisplayName } from '../utils';
import type { OrderBookUnit, PerpsOrderBookProps } from './order-book.types';

const DEPTH_BAR_OPACITY = 0.14;

/**
 * Formats the cumulative total for a level based on the selected unit.
 *
 * @param level - Order book level.
 * @param unit - Selected display unit ('base' | 'usd').
 * @returns Formatted total string.
 */
function formatTotal(level: OrderBookLevel, unit: OrderBookUnit): string {
  if (unit === 'usd') {
    const value = Number.parseFloat(level.totalNotional);
    if (value >= 1_000_000) {
      return `$${formatLargeNumber(value, { decimals: 1 })}`;
    }
    if (value >= 10_000) {
      return `$${formatLargeNumber(value, { decimals: 0 })}`;
    }
    return formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL });
  }
  const total = Number.parseFloat(level.total);
  if (total >= 1) {
    return total.toFixed(4);
  }
  return total.toFixed(6);
}

/**
 * Depth-bar width (0-100) for a level relative to the deepest level.
 *
 * @param level - Order book level.
 * @param maxTotal - Maximum cumulative size across all levels.
 * @returns Width as a percentage.
 */
function getDepthWidth(level: OrderBookLevel, maxTotal: string): number {
  const max = Number.parseFloat(maxTotal);
  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }
  const total = Number.parseFloat(level.total);
  return Math.min((total / max) * 100, 100);
}

type OrderBookRowProps = {
  level: OrderBookLevel;
  side: 'bid' | 'ask';
  unit: OrderBookUnit;
  maxTotal: string;
  testId: string;
};

const OrderBookRow = ({
  level,
  side,
  unit,
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
      className="relative py-0.5"
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
        variant={TextVariant.BodyXs}
        color={isBid ? TextColor.SuccessDefault : TextColor.ErrorDefault}
        className="relative z-10"
      >
        {formatPerpsFiat(level.price, { ranges: PRICE_RANGES_UNIVERSAL })}
      </Text>
      <Text
        variant={TextVariant.BodyXs}
        color={TextColor.TextAlternative}
        className="relative z-10"
      >
        {formatTotal(level, unit)}
      </Text>
    </Box>
  );
};

/**
 * PerpsOrderBook - Live bid/ask order book with depth bars.
 *
 * Reads from the shared order-book stream channel (the surrounding order entry
 * page owns the stream lifecycle) and renders asks (top), the current spread
 * (middle) and bids (bottom) in a single vertical ladder.
 * @param options0
 * @param options0.symbol
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.'data-testid'
 */
export const PerpsOrderBook = ({
  symbol,
  isOpen,
  onClose,
  'data-testid': dataTestId = 'perps-order-book',
}: PerpsOrderBookProps) => {
  const t = useI18nContext();
  const [unit, setUnit] = useState<OrderBookUnit>('usd');

  // The order entry page already activates/deactivates the background
  // order-book stream, so we only read from the shared channel here.
  const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
    symbol,
    manageStream: false,
    enabled: isOpen,
  });

  const displaySymbol = getDisplayName(symbol);
  const unitLabel = unit === 'usd' ? 'USD' : displaySymbol;

  // Asks come lowest-price-first; render highest at the top so the best ask
  // sits directly above the spread row (classic ladder layout).
  const reversedAsks = useMemo(
    () => (orderBook?.asks ? [...orderBook.asks].reverse() : []),
    [orderBook?.asks],
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

  const handleUnitToggle = useCallback(
    (next: OrderBookUnit) => setUnit(next),
    [],
  );

  const renderUnitButton = (value: OrderBookUnit, label: string) => {
    const isActive = unit === value;
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        onClick={() => handleUnitToggle(value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleUnitToggle(value);
          }
        }}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className={twMerge(
          'flex-1 rounded-md py-1 cursor-pointer',
          isActive ? 'bg-muted' : 'bg-transparent',
        )}
        data-testid={`${dataTestId}-unit-${value}`}
      >
        <Text
          variant={TextVariant.BodyXs}
          fontWeight={isActive ? FontWeight.Medium : FontWeight.Regular}
          color={isActive ? TextColor.TextDefault : TextColor.TextAlternative}
        >
          {label}
        </Text>
      </Box>
    );
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full overflow-hidden bg-default"
      data-testid={dataTestId}
    >
      {/* Header */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={3}
        paddingRight={2}
        paddingTop={3}
        paddingBottom={2}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Bold}>
          {t('perpsOrderBook')}
        </Text>
        <ButtonIcon
          iconName={IconName.Close}
          size={ButtonIconSize.Sm}
          ariaLabel={t('close')}
          onClick={onClose}
          iconProps={{ color: IconColor.IconAlternative }}
          data-testid={`${dataTestId}-close`}
        />
      </Box>

      {/* Unit toggle */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={1}
        marginLeft={3}
        marginRight={3}
        marginBottom={2}
        className="rounded-lg bg-section p-0.5"
      >
        {renderUnitButton('base', displaySymbol)}
        {renderUnitButton('usd', 'USD')}
      </Box>

      {/* Column headers */}
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={3}
        paddingRight={3}
        paddingBottom={1}
      >
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          {t('perpsOrderBookPrice')}
        </Text>
        <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
          {`${t('perpsOrderBookTotal')} (${unitLabel})`}
        </Text>
      </Box>

      {/* Ladder */}
      {isInitialLoading || !orderBook ? (
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
                unit={unit}
                maxTotal={orderBook.maxTotal}
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
            paddingTop={1}
            paddingBottom={1}
            className="border-y border-muted my-0.5"
            data-testid={`${dataTestId}-spread`}
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Bold}
              color={TextColor.TextDefault}
            >
              {formatPerpsFiat(orderBook.midPrice, {
                ranges: PRICE_RANGES_UNIVERSAL,
              })}
            </Text>
            {spreadDisplay && (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                {spreadDisplay}
              </Text>
            )}
          </Box>

          {/* Bids (buy) */}
          <Box flexDirection={BoxFlexDirection.Column}>
            {orderBook.bids.map((level, index) => (
              <OrderBookRow
                key={`bid-${level.price}`}
                level={level}
                side="bid"
                unit={unit}
                maxTotal={orderBook.maxTotal}
                testId={`${dataTestId}-bid-${index}`}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
