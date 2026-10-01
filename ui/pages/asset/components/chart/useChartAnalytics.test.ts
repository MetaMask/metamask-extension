/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import { renderHook } from '@testing-library/react';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  CHART_TYPE_CANDLE,
  CHART_TYPE_LINE,
} from './advanced-chart-interval-bar';
import { useChartAnalytics } from './useChartAnalytics';

const mockTrackEvent = jest.fn();

jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const renderChartAnalytics = ({
  chartType = CHART_TYPE_CANDLE,
  indicators = new Set<string>(),
}: { chartType?: number; indicators?: Set<string> } = {}) =>
  renderHook(() => useChartAnalytics({ chartType, indicators })).result;

const trackedEvent = () => mockTrackEvent.mock.calls[0][0];

describe('useChartAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackChartInteraction', () => {
    it('sends a Chart Interacted event carrying the interaction type', () => {
      const { current } = renderChartAnalytics();

      current.trackChartInteraction({ interactionType: 'zoom' });

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(trackedEvent()).toMatchObject({
        name: MetaMetricsEventName.ChartInteracted,
        properties: { interaction_type: 'zoom' },
      });
    });

    it('reports the active chart type', () => {
      const { current } = renderChartAnalytics({
        chartType: CHART_TYPE_LINE,
      });

      current.trackChartInteraction({ interactionType: 'pan' });

      expect(trackedEvent().properties.chart_type).toBe('line');
    });

    it('reports the overriding chart type when one is given', () => {
      const { current } = renderChartAnalytics({
        chartType: CHART_TYPE_LINE,
      });

      current.trackChartInteraction({
        interactionType: 'chart_type_changed',
        chartType: CHART_TYPE_CANDLE,
      });

      expect(trackedEvent().properties.chart_type).toBe('candlestick');
    });

    it('defaults the active indicators to current chart state', () => {
      const { current } = renderChartAnalytics({
        indicators: new Set(['RSI', 'MA20']),
      });

      current.trackChartInteraction({ interactionType: 'tooltip' });

      expect(trackedEvent().properties.indicators_active).toStrictEqual([
        'RSI',
        'MA20',
      ]);
    });

    it('prefers an explicitly supplied indicator list over chart state', () => {
      const { current } = renderChartAnalytics({
        indicators: new Set(['RSI']),
      });

      current.trackChartInteraction({
        interactionType: 'indicator_toggled',
        indicatorType: 'MACD',
        indicatorAction: 'on',
        indicatorsActive: ['RSI', 'MACD'],
      });

      expect(trackedEvent().properties).toMatchObject({
        indicator_type: 'MACD',
        indicator_action: 'on',
        indicators_active: ['RSI', 'MACD'],
      });
    });

    it('omits the active indicators on a timeframe change, matching mobile', () => {
      const { current } = renderChartAnalytics({
        indicators: new Set(['RSI']),
      });

      current.trackChartInteraction({
        interactionType: 'timeframe_changed',
        chartTimeframe: '1W',
      });

      expect(trackedEvent().properties).toMatchObject({
        chart_timeframe: '1W',
      });
      expect(trackedEvent().properties).not.toHaveProperty('indicators_active');
    });

    it('omits properties that do not apply to the interaction', () => {
      const { current } = renderChartAnalytics();

      current.trackChartInteraction({
        interactionType: 'granularity_changed',
        chartGranularity: '15m',
      });

      expect(trackedEvent().properties.chart_granularity).toBe('15m');
      expect(trackedEvent().properties).not.toHaveProperty('chart_timeframe');
      expect(trackedEvent().properties).not.toHaveProperty('indicator_type');
      expect(trackedEvent().properties).not.toHaveProperty('indicator_action');
      expect(trackedEvent().properties).not.toHaveProperty('selector_type');
    });
  });

  describe('trackChartEmptyDisplayed', () => {
    it('sends a Chart Empty Displayed event', () => {
      const { current } = renderChartAnalytics();

      current.trackChartEmptyDisplayed();

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(trackedEvent()).toMatchObject({
        name: MetaMetricsEventName.ChartEmptyDisplayed,
      });
    });
  });
});
