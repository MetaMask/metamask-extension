import React, { useEffect, useRef } from 'react';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  IconColor,
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
  const toolbarText = 'var(--color-text-default)';
  const toolbarMuted = 'var(--color-text-alternative)';
  const activeBg = 'var(--color-background-default-hover)';

  const pillStyle = (isSelected: boolean) => ({
    padding: '4px 10px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 500,
    background: isSelected ? activeBg : 'transparent',
    color: isSelected ? toolbarText : toolbarMuted,
    // The row scrolls when the intervals outgrow it; squashing the labels
    // would be worse, and a half-width pill reads as a rendering bug.
    flexShrink: 0,
  });

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
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] tablist-fade"
      >
        {intervals.map((interval) => {
          const isSelected =
            selectedInterval.toLowerCase() === interval.toLowerCase();
          return (
            <button
              key={interval}
              type="button"
              aria-pressed={isSelected}
              ref={isSelected ? selectedPillRef : undefined}
              onClick={() => onIntervalSelect(interval)}
              style={pillStyle(isSelected)}
            >
              {interval}
            </button>
          );
        })}
      </Box>

      {/* Chart type toggle — mirrors mobile's ChartTypeToggle.tsx */}
      <div
        data-testid="advanced-chart-type-toggle"
        style={{
          display: 'flex',
          gap: '2px',
          padding: '2px',
          borderRadius: '8px',
          border: '1px solid var(--color-border-muted)',
          // Pinned: the toggle is not part of the scrolling row, and must
          // keep its full width so it stays inside the 16px right padding.
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label={t('chartTypeLine')}
          aria-pressed={chartType === CHART_TYPE_LINE}
          onClick={() => onChartTypeSelect(CHART_TYPE_LINE)}
          title={t('chartTypeLine')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background:
              chartType === CHART_TYPE_LINE ? activeBg : 'transparent',
          }}
        >
          <Icon
            name={IconName.Diagram}
            size={IconSize.Sm}
            color={
              chartType === CHART_TYPE_LINE
                ? IconColor.IconDefault
                : IconColor.IconAlternative
            }
          />
        </button>
        <button
          type="button"
          aria-label={t('chartTypeCandlestick')}
          aria-pressed={chartType === CHART_TYPE_CANDLE}
          onClick={() => onChartTypeSelect(CHART_TYPE_CANDLE)}
          title={t('chartTypeCandlestick')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background:
              chartType === CHART_TYPE_CANDLE ? activeBg : 'transparent',
          }}
        >
          <Icon
            name={IconName.Candlestick}
            size={IconSize.Sm}
            color={
              chartType === CHART_TYPE_CANDLE
                ? IconColor.IconDefault
                : IconColor.IconAlternative
            }
          />
        </button>
      </div>
    </div>
  );
};

export default IntervalBar;
