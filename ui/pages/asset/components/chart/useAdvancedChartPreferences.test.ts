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

// Wire useSelector to call through to the individual mocked selectors.
function setupSelectorMock(overrides?: {
  chartType?: number;
  interval?: string;
  indicators?: string[];
}) {
  const chartType = overrides?.chartType ?? CHART_TYPE_LINE;
  const interval = overrides?.interval ?? '15m';
  const indicators = overrides?.indicators ?? [];

  mockGetTdpChartType.mockReturnValue(chartType);
  mockGetTdpChartInterval.mockReturnValue(interval);
  mockGetTdpChartIndicators.mockReturnValue(indicators);

  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === getTdpChartType) {
      return chartType;
    }
    if (selector === getTdpChartInterval) {
      return interval;
    }
    if (selector === getTdpChartIndicators) {
      return indicators;
    }
    return undefined;
  });
}

describe('useAdvancedChartPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupSelectorMock();
  });

  // --- Defaults ---

  it('returns default chart type (Line) when no preference is persisted', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.chartType).toBe(CHART_TYPE_LINE);
    expect(result.current.isLineChart).toBe(true);
  });

  it('returns default interval (15m) when no preference is persisted', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.interval).toBe('15m');
  });

  it('returns empty indicators set when no preference is persisted', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.indicators.size).toBe(0);
  });

  // --- Persisted values ---

  it('reads persisted chart type from PreferencesController', () => {
    setupSelectorMock({ chartType: CHART_TYPE_CANDLE });
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.chartType).toBe(CHART_TYPE_CANDLE);
    expect(result.current.isLineChart).toBe(false);
  });

  it('reads persisted interval from PreferencesController', () => {
    setupSelectorMock({ interval: '4h' });
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.interval).toBe('4h');
  });

  it('reads persisted indicators from PreferencesController', () => {
    setupSelectorMock({ indicators: ['RSI', 'MACD'] });
    const { result } = renderHook(() => useAdvancedChartPreferences());
    expect(result.current.indicators).toEqual(new Set(['RSI', 'MACD']));
  });

  // --- Local override + background save ---

  it('setChartType updates instantly and persists to background', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());

    act(() => {
      result.current.setChartType(CHART_TYPE_CANDLE);
    });

    expect(result.current.chartType).toBe(CHART_TYPE_CANDLE);
    expect(result.current.isLineChart).toBe(false);
    expect(mockSubmit).toHaveBeenCalledWith('setPreference', [
      'tdpChartType',
      CHART_TYPE_CANDLE,
    ]);
  });

  it('setInterval updates instantly and persists to background', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());

    act(() => {
      result.current.setInterval('1d');
    });

    expect(result.current.interval).toBe('1d');
    expect(mockSubmit).toHaveBeenCalledWith('setPreference', [
      'tdpChartInterval',
      '1d',
    ]);
  });

  it('toggleIndicator adds an indicator and persists', () => {
    const { result } = renderHook(() => useAdvancedChartPreferences());

    act(() => {
      result.current.toggleIndicator('RSI');
    });

    expect(result.current.indicators.has('RSI')).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith('setPreference', [
      'tdpChartIndicators',
      ['RSI'],
    ]);
  });

  it('toggleIndicator removes an already-active indicator and persists', () => {
    setupSelectorMock({ indicators: ['RSI', 'MACD'] });
    const { result } = renderHook(() => useAdvancedChartPreferences());

    act(() => {
      result.current.toggleIndicator('RSI');
    });

    expect(result.current.indicators.has('RSI')).toBe(false);
    expect(result.current.indicators.has('MACD')).toBe(true);
    expect(mockSubmit).toHaveBeenCalledWith('setPreference', [
      'tdpChartIndicators',
      expect.arrayContaining(['MACD']),
    ]);
  });

  // --- Cross-token persistence ---

  it('preserves preferences when component remounts (simulates token navigation)', () => {
    setupSelectorMock({
      chartType: CHART_TYPE_CANDLE,
      interval: '1h',
      indicators: ['Volume', 'MA20'],
    });

    // First mount (Token A)
    const { result: resultA, unmount } = renderHook(() =>
      useAdvancedChartPreferences(),
    );
    expect(resultA.current.chartType).toBe(CHART_TYPE_CANDLE);
    expect(resultA.current.interval).toBe('1h');
    expect(resultA.current.indicators).toEqual(new Set(['Volume', 'MA20']));

    // Unmount (navigate away)
    unmount();

    // Second mount (Token B) — same persisted prefs
    const { result: resultB } = renderHook(() => useAdvancedChartPreferences());
    expect(resultB.current.chartType).toBe(CHART_TYPE_CANDLE);
    expect(resultB.current.interval).toBe('1h');
    expect(resultB.current.indicators).toEqual(new Set(['Volume', 'MA20']));
  });

  // --- Background save is best-effort ---

  it('does not throw when background save fails', () => {
    mockSubmit.mockRejectedValueOnce(new Error('background unavailable'));
    const { result } = renderHook(() => useAdvancedChartPreferences());

    expect(() => {
      act(() => {
        result.current.setChartType(CHART_TYPE_CANDLE);
      });
    }).not.toThrow();

    // Local state still updates despite background failure.
    expect(result.current.chartType).toBe(CHART_TYPE_CANDLE);
  });
});
