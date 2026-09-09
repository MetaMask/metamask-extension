import React from 'react';
import {
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useTheme } from '../../../../hooks/useTheme';

/**
 * [POC — THROWAWAY] IntervalBar
 *
 * Mirrors mobile's IntervalBar.tsx + ChartTypeToggle.tsx.
 * Renders interval pills (1m…1w) and a line/candle chart-type toggle.
 * Displayed ABOVE the chart, as a separate component in the parent layout.
 */

// Chart types matching TradingView + mobile conventions
export const CHART_TYPE_CANDLE = 1;
export const CHART_TYPE_LINE = 2;

const INTERVAL_KEYS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

type IntervalBarProps = {
  selectedInterval: string;
  onIntervalSelect: (interval: string) => void;
  chartType: number;
  onChartTypeSelect: (type: number) => void;
};

const IntervalBar = ({
  selectedInterval,
  onIntervalSelect,
  chartType,
  onChartTypeSelect,
}: IntervalBarProps) => {
  const theme = useTheme();
  const isDark = theme === 'dark';

  const toolbarText = 'var(--color-text-default)';
  const toolbarMuted = 'var(--color-text-muted)';
  const activeBg = isDark
    ? 'var(--color-background-default-pressed)'
    : 'var(--color-background-default-hover)';

  const pillStyle = (isSelected: boolean) => ({
    padding: '4px 10px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: isSelected ? 600 : 500,
    background: isSelected ? activeBg : 'transparent',
    color: isSelected ? toolbarText : toolbarMuted,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 16px',
      }}
    >
      {INTERVAL_KEYS.map((interval) => (
        <button
          key={interval}
          onClick={() => onIntervalSelect(interval)}
          style={pillStyle(selectedInterval === interval)}
        >
          {interval}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Chart type toggle — mirrors mobile's ChartTypeToggle.tsx */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          padding: '2px',
          borderRadius: '8px',
          border: '1px solid var(--color-border-muted)',
        }}
      >
        <button
          onClick={() => onChartTypeSelect(CHART_TYPE_LINE)}
          title="Line chart"
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
          onClick={() => onChartTypeSelect(CHART_TYPE_CANDLE)}
          title="Candle chart"
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
