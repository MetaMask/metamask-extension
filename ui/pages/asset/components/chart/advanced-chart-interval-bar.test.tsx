import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import IntervalBar, {
  CHART_TYPE_CANDLE,
  CHART_TYPE_LINE,
  LINE_CHART_TIME_RANGES,
  LINE_TIME_RANGE_TO_ISO8601,
} from './advanced-chart-interval-bar';

const DEFAULT_PROPS = {
  selectedInterval: '15m',
  onIntervalSelect: jest.fn(),
  chartType: CHART_TYPE_CANDLE,
  onChartTypeSelect: jest.fn(),
};

function renderBar(
  props: Partial<React.ComponentProps<typeof IntervalBar>> = {},
) {
  return renderWithProvider(
    <IntervalBar {...DEFAULT_PROPS} {...props} />,
    configureStore({ metamask: { currentLocale: 'en' } }),
  );
}

/** The interval labels on screen, in order. */
function intervalLabels(): string[] {
  return Array.from(
    screen.getByTestId('advanced-chart-intervals').querySelectorAll('button'),
  ).map((button) => button.textContent ?? '');
}

describe('IntervalBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('intervals', () => {
    it('shows the candle granularities by default', () => {
      renderBar();

      expect(intervalLabels()).toStrictEqual([
        '1m',
        '5m',
        '15m',
        '1h',
        '4h',
        '1d',
        '1w',
      ]);
    });

    it('shows the time ranges it is given instead, for line mode', () => {
      renderBar({ intervals: LINE_CHART_TIME_RANGES, selectedInterval: '1D' });

      expect(intervalLabels()).toStrictEqual([...LINE_CHART_TIME_RANGES]);
    });

    it('reports the chosen interval', () => {
      renderBar();

      fireEvent.click(screen.getByText('4h'));

      expect(DEFAULT_PROPS.onIntervalSelect).toHaveBeenCalledWith('4h');
    });

    it('marks the selection regardless of label casing', () => {
      // Candle intervals persist lowercase but line ranges are uppercase, and
      // both go through this same prop.
      renderBar({ intervals: LINE_CHART_TIME_RANGES, selectedInterval: '1d' });

      expect(screen.getByRole('button', { name: '1D' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '1W' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('fitting a narrow panel', () => {
    it('scrolls the intervals rather than pushing the toggle off the edge', () => {
      renderBar();

      // Seven pills plus the toggle outgrow a narrowed side panel, and none
      // of them shrink, so without this the toggle is clipped at the edge.
      expect(screen.getByTestId('advanced-chart-intervals')).toHaveClass(
        'min-w-0',
        'flex-1',
        'overflow-x-auto',
      );
    });

    it('keeps the chart type toggle at full width inside the padding', () => {
      renderBar();

      expect(screen.getByTestId('advanced-chart-type-toggle')).toHaveClass(
        'shrink-0',
      );
    });

    it('brings the selected interval into view', () => {
      const scrollIntoView = jest.spyOn(
        window.HTMLElement.prototype,
        'scrollIntoView',
      );

      renderBar({ selectedInterval: '1w' });

      // A persisted far-right selection would otherwise open off screen.
      expect(scrollIntoView).toHaveBeenCalledWith({
        inline: 'nearest',
        block: 'nearest',
      });
      scrollIntoView.mockRestore();
    });
  });

  describe('chart type toggle', () => {
    it('reports a switch to line', () => {
      renderBar();

      fireEvent.click(
        screen.getByRole('button', { name: messages.chartTypeLine.message }),
      );

      expect(DEFAULT_PROPS.onChartTypeSelect).toHaveBeenCalledWith(
        CHART_TYPE_LINE,
      );
    });

    it('reports a switch to candles', () => {
      renderBar({ chartType: CHART_TYPE_LINE });

      fireEvent.click(
        screen.getByRole('button', {
          name: messages.chartTypeCandlestick.message,
        }),
      );

      expect(DEFAULT_PROPS.onChartTypeSelect).toHaveBeenCalledWith(
        CHART_TYPE_CANDLE,
      );
    });

    it('exposes the pressed state of each chart type to assistive tech', () => {
      renderBar({ chartType: CHART_TYPE_LINE });

      expect(
        screen.getByRole('button', { name: messages.chartTypeLine.message }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByRole('button', {
          name: messages.chartTypeCandlestick.message,
        }),
      ).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('accessibility', () => {
    it('exposes the pressed state of the selected interval', () => {
      renderBar({ selectedInterval: '4h' });

      expect(screen.getByRole('button', { name: '4h' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '1h' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('LINE_TIME_RANGE_TO_ISO8601', () => {
    it('maps every offered time range to a duration', () => {
      LINE_CHART_TIME_RANGES.forEach((range) => {
        expect(LINE_TIME_RANGE_TO_ISO8601[range]).toBeDefined();
      });
    });
  });
});
