import React, { useEffect, useRef } from 'react';
import {
  Box,
  ButtonBase,
  ButtonIcon,
  ButtonIconSize,
  ButtonIconVariant,
  IconName,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

/**
 * Mirrors mobile's IntervalBar.tsx + ChartTypeToggle.tsx.
 * Renders selection pills and a line/candle chart-type toggle.
 * Displayed ABOVE the chart, as a separate component in the parent layout.
 */

// Chart types matching TradingView + mobile conventions
export const CHART_TYPE_CANDLE = 1;
export const CHART_TYPE_LINE = 2;

/** Candle-granularity intervals for candlestick chart mode. */
const CANDLE_INTERVAL_KEYS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

/**
 * Time-range options shown in the IntervalBar when chart type is Line. These
 * replace the legacy chart's own selector row, which the advanced layout hides.
 */
export const LINE_CHART_TIME_RANGES = ['1H', '1D', '1W', '1M', '1Y'] as const;

/** Maps a line time range to the ISO 8601 duration `useHistoricalPrices` wants. */
export const LINE_TIME_RANGE_TO_ISO8601: Record<string, string> = {
  '1H': 'PT1H',
  '1D': 'P1D',
  '1W': 'P1W',
  '1M': 'P1M',
  '1Y': 'P1Y',
};

type IntervalBarProps = {
  /** Override the default candle intervals, e.g. time-range labels for line mode. */
  intervals?: readonly string[];
  selectedInterval: string;
  onIntervalSelect: (interval: string) => void;
  chartType: number;
  onChartTypeSelect: (type: number) => void;
};

const IntervalBar = ({
  intervals = CANDLE_INTERVAL_KEYS,
  selectedInterval,
  onIntervalSelect,
  chartType,
  onChartTypeSelect,
}: IntervalBarProps) => {
  const t = useI18nContext();
  const isLine = chartType === CHART_TYPE_LINE;
  const isCandle = chartType === CHART_TYPE_CANDLE;

  // A persisted selection near the end of the list, `1w` say, would otherwise
  // open scrolled out of sight with nothing to say which interval is active.
  const selectedPillRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    selectedPillRef.current?.scrollIntoView({
      inline: 'nearest',
      block: 'nearest',
    });
  }, [selectedInterval, intervals]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        // Only the right edge is padded here. The scrolling row owns the left
        // inset so the first pill scrolls under it rather than being clipped
        // by it, and `tablist-fade` positions its gradients against the same
        // 16px. Both match the action buttons below the chart.
        paddingBlock: '6px',
        paddingRight: '16px',
      }}
    >
      {/* Seven candle intervals plus the toggle do not fit a narrowed side
          panel, and none of them shrink. Scroll them instead of letting the
          row push the toggle out past the padding. `tablist-fade` is the same
          treatment the account overview tab list uses: the scrollbar is
          hidden, so the gradient is what says there is more to see. */}
      <Box
        data-testid="advanced-chart-intervals"
        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] tablist-fade"
      >
        {intervals.map((interval) => {
          const isSelected =
            selectedInterval.toLowerCase() === interval.toLowerCase();
          return (
            <ButtonBase
              key={interval}
              type="button"
              aria-pressed={isSelected}
              ref={isSelected ? selectedPillRef : undefined}
              // Re-selecting the active interval is a no-op: skip it so it does
              // not fire a redundant selection (which would re-emit a
              // `granularity_changed`/`timeframe_changed` analytics event and
              // trigger needless re-renders). Mirrors the same-value guard in
              // the chart-type handler.
              onClick={() => {
                if (!isSelected) {
                  onIntervalSelect(interval);
                }
              }}
              className={twMerge(
                'h-auto shrink-0 rounded-full bg-transparent px-2 py-1 hover:bg-hover active:bg-pressed',
                isSelected && 'bg-muted',
              )}
            >
              <Text
                variant={TextVariant.BodyXs}
                color={
                  isSelected ? TextColor.TextDefault : TextColor.TextAlternative
                }
              >
                {interval}
              </Text>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Chart type toggle — mirrors mobile's ChartTypeToggle.tsx. The segmented
          container has no DS equivalent, so it is a fully-rounded `Box`; the two
          controls are stock `ButtonIcon`s (circular by default), and the
          selected one uses the Filled variant for its background. */}
      <Box
        data-testid="advanced-chart-type-toggle"
        className="flex shrink-0 items-center gap-1 rounded-full border border-muted p-1"
      >
        <ButtonIcon
          iconName={IconName.Diagram}
          ariaLabel={t('chartTypeLine')}
          title={t('chartTypeLine')}
          size={ButtonIconSize.Xs}
          variant={
            isLine ? ButtonIconVariant.Filled : ButtonIconVariant.Default
          }
          aria-pressed={isLine}
          onClick={() => onChartTypeSelect(CHART_TYPE_LINE)}
          iconProps={{
            className: isLine ? 'text-icon-default' : 'text-icon-alternative',
          }}
        />
        <ButtonIcon
          iconName={IconName.Candlestick}
          ariaLabel={t('chartTypeCandlestick')}
          title={t('chartTypeCandlestick')}
          size={ButtonIconSize.Xs}
          variant={
            isCandle ? ButtonIconVariant.Filled : ButtonIconVariant.Default
          }
          aria-pressed={isCandle}
          onClick={() => onChartTypeSelect(CHART_TYPE_CANDLE)}
          iconProps={{
            className: isCandle ? 'text-icon-default' : 'text-icon-alternative',
          }}
        />
      </Box>
    </div>
  );
};

export default IntervalBar;
