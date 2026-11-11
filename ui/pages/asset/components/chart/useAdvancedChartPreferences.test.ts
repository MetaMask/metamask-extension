import { renderHook, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  getTdpChartType,
  getTdpChartInterval,
  getTdpChartIndicators,
} from '../../../../../shared/lib/selectors/preferences';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { useAdvancedChartPreferences } from './useAdvancedChartPreferences';
import {
  CHART_TYPE_LINE,
  CHART_TYPE_CANDLE,
} from './advanced-chart-interval-bar';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../../shared/lib/selectors/preferences');
jest.mock('../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../store/background-connection'),
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockGetTdpChartType = jest.mocked(getTdpChartType);
const mockGetTdpChartInterval = jest.mocked(getTdpChartInterval);
const mockGetTdpChartIndicators = jest.mocked(getTdpChartIndicators);
const mockSubmit = jest.mocked(submitRequestToBackground);

/** The only background entry point that actually reaches the controller. */
const SET_PREFERENCE = 'PreferencesController:setPreference';

// Stands in for PreferencesController state, so a write can be observed
// feeding back into what the selectors return on the next render.
let preferences: { chartType: number; interval: string; indicators: string[] };

function setupPreferences(overrides?: Partial<typeof preferences>) {
  preferences = {
    chartType: CHART_TYPE_LINE,
    interval: '15m',
    indicators: [],
    ...overrides,
  };
}

/**
 * Applies a `setPreference` call to the fake controller state, the way the
 * background would before the new state flows back to the UI.
 *
 * @param call - The arguments the hook passed to `submitRequestToBackground`.
 */
function applyWrite(call: unknown[]) {
  const [action, [key, value]] = call as [string, [string, unknown]];
  expect(action).toBe(SET_PREFERENCE);
  if (key === 'tdpChartType') {
    preferences.chartType = value as number;
  } else if (key === 'tdpChartInterval') {
    preferences.interval = value as string;
  } else if (key === 'tdpChartIndicators') {
    preferences.indicators = value as string[];
  } else {
    throw new Error(`Unexpected preference ${key}`);
  }
}

/** Replays every write the hook has made, then re-reads from a fresh mount. */
function remountAfterWrites() {
  mockSubmit.mock.calls.forEach(applyWrite);
  return renderHook(() => useAdvancedChartPreferences());
}

describe('useAdvancedChartPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPreferences();

    mockGetTdpChartType.mockImplementation(() => preferences.chartType);
    mockGetTdpChartInterval.mockImplementation(() => preferences.interval);
    mockGetTdpChartIndicators.mockImplementation(() => preferences.indicators);

    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === getTdpChartType) {
        return preferences.chartType;
      }
      if (selector === getTdpChartInterval) {
        return preferences.interval;
      }
      if (selector === getTdpChartIndicators) {
        return preferences.indicators;
      }
      return undefined;
    });
  });

  describe('reading persisted values', () => {
    it('falls back to line, 15m and no indicators when nothing is persisted', () => {
      const { result } = renderHook(() => useAdvancedChartPreferences());

      expect(result.current.chartType).toBe(CHART_TYPE_LINE);
      expect(result.current.isLineChart).toBe(true);
      expect(result.current.interval).toBe('15m');
      expect(result.current.indicators.size).toBe(0);
    });

    it('reports what PreferencesController holds', () => {
      setupPreferences({
        chartType: CHART_TYPE_CANDLE,
        interval: '4h',
        indicators: ['RSI', 'MACD'],
      });
      const { result } = renderHook(() => useAdvancedChartPreferences());

      expect(result.current.chartType).toBe(CHART_TYPE_CANDLE);
      expect(result.current.isLineChart).toBe(false);
      expect(result.current.interval).toBe('4h');
      expect(result.current.indicators).toStrictEqual(new Set(['RSI', 'MACD']));
    });
  });

  describe('writing preferences', () => {
    it('persists the chart type through the namespaced messenger action', () => {
      const { result } = renderHook(() => useAdvancedChartPreferences());

      act(() => {
        result.current.setChartType(CHART_TYPE_CANDLE);
      });

      expect(mockSubmit).toHaveBeenCalledWith(SET_PREFERENCE, [
        'tdpChartType',
        CHART_TYPE_CANDLE,
      ]);
    });

    it('persists the candle interval through the namespaced messenger action', () => {
      const { result } = renderHook(() => useAdvancedChartPreferences());

      act(() => {
        result.current.setCandleInterval('1d');
      });

      expect(mockSubmit).toHaveBeenCalledWith(SET_PREFERENCE, [
        'tdpChartInterval',
        '1d',
      ]);
    });

    it('persists the whole indicator set when one is added', () => {
      setupPreferences({ indicators: ['MACD'] });
      const { result } = renderHook(() => useAdvancedChartPreferences());

      act(() => {
        result.current.toggleIndicator('Volume');
      });

      expect(mockSubmit).toHaveBeenCalledWith(SET_PREFERENCE, [
        'tdpChartIndicators',
        ['MACD', 'Volume'],
      ]);
    });

    it('persists the whole indicator set when one is removed', () => {
      setupPreferences({ indicators: ['RSI', 'MACD'] });
      const { result } = renderHook(() => useAdvancedChartPreferences());

      act(() => {
        result.current.toggleIndicator('RSI');
      });

      expect(mockSubmit).toHaveBeenCalledWith(SET_PREFERENCE, [
        'tdpChartIndicators',
        ['MACD'],
      ]);
    });

    it('survives a failed write instead of rejecting unhandled', () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockSubmit.mockRejectedValueOnce(new Error('background unavailable'));
      const { result } = renderHook(() => useAdvancedChartPreferences());

      expect(() => {
        act(() => {
          result.current.setChartType(CHART_TYPE_CANDLE);
        });
      }).not.toThrow();
    });
  });

  describe('carrying preferences to the next token', () => {
    it('shows the chart type chosen on the previous token', () => {
      const { result, unmount } = renderHook(() =>
        useAdvancedChartPreferences(),
      );

      act(() => {
        result.current.setChartType(CHART_TYPE_CANDLE);
      });
      unmount();

      expect(remountAfterWrites().result.current.chartType).toBe(
        CHART_TYPE_CANDLE,
      );
    });

    it('shows the interval chosen on the previous token', () => {
      const { result, unmount } = renderHook(() =>
        useAdvancedChartPreferences(),
      );

      act(() => {
        result.current.setCandleInterval('1h');
      });
      unmount();

      expect(remountAfterWrites().result.current.interval).toBe('1h');
    });

    it('shows an indicator added on the previous token', () => {
      const { result, unmount } = renderHook(() =>
        useAdvancedChartPreferences(),
      );

      act(() => {
        result.current.toggleIndicator('Volume');
      });
      unmount();

      expect(remountAfterWrites().result.current.indicators).toStrictEqual(
        new Set(['Volume']),
      );
    });

    it('drops an indicator removed on the previous token', () => {
      setupPreferences({ indicators: ['MA5', 'MA10'] });
      const { result, unmount } = renderHook(() =>
        useAdvancedChartPreferences(),
      );

      act(() => {
        result.current.toggleIndicator('MA5');
      });
      unmount();

      expect(remountAfterWrites().result.current.indicators).toStrictEqual(
        new Set(['MA10']),
      );
    });
  });

  describe('line mode time range', () => {
    it('defaults to 1D, updates locally, and is never persisted', () => {
      const { result } = renderHook(() => useAdvancedChartPreferences());

      expect(result.current.lineTimeRange).toBe('1D');

      act(() => {
        result.current.setLineTimeRange('1W');
      });

      expect(result.current.lineTimeRange).toBe('1W');
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});
