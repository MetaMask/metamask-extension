import { it } from '@jest/globals';
import {
  CANDLE_INTERVAL_CONFIG,
  CANDLE_INTERVALS,
  DEFAULT_LINE_RANGE,
  getCandleIntervalConfig,
  getLineRangeConfig,
  getOhlcvTimePeriod,
  getTvResolution,
  isCandleInterval,
  LINE_RANGE_CONFIG,
  LINE_RANGES,
  mapCandleIntervalToLineRange,
  nearestByWindow,
  type OhlcvTimePeriod,
  resolveCandleForLineRange,
} from './chart-window-mapping';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const pick = <Key extends string, Value>(
  config: Record<Key, Value>,
  select: (value: Value) => unknown,
) =>
  Object.fromEntries(
    Object.entries<Value>(config).map(([key, value]) => [key, select(value)]),
  );

describe('chart-window-mapping', () => {
  describe('CANDLE_INTERVAL_CONFIG', () => {
    it('lists intervals finest -> coarsest', () => {
      expect(CANDLE_INTERVALS).toStrictEqual([
        '1m',
        '5m',
        '15m',
        '1h',
        '4h',
        '1d',
        '1w',
      ]);
    });

    it('uses TradingView resolution format (hours as minutes)', () => {
      expect(
        pick(CANDLE_INTERVAL_CONFIG, (config) => config.tvResolution),
      ).toStrictEqual({
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '1h': '60',
        '4h': '240',
        '1d': '1D',
        '1w': '1W',
      });
    });

    it('has the expected candle durations', () => {
      expect(
        pick(CANDLE_INTERVAL_CONFIG, (config) => config.durationMs),
      ).toStrictEqual({
        '1m': MINUTE_MS,
        '5m': 5 * MINUTE_MS,
        '15m': 15 * MINUTE_MS,
        '1h': HOUR_MS,
        '4h': 4 * HOUR_MS,
        '1d': DAY_MS,
        '1w': 7 * DAY_MS,
      });
    });

    it('has the expected visible windows', () => {
      expect(
        pick(CANDLE_INTERVAL_CONFIG, (config) => config.visibleWindowMs),
      ).toStrictEqual({
        '1m': HOUR_MS,
        '5m': 12 * HOUR_MS,
        '15m': DAY_MS,
        '1h': 7 * DAY_MS,
        '4h': 7 * DAY_MS,
        '1d': 30 * DAY_MS,
        '1w': 365 * DAY_MS,
      });
    });

    it('has the expected OHLCV time periods', () => {
      expect(
        pick(CANDLE_INTERVAL_CONFIG, (config) => config.timePeriod),
      ).toStrictEqual({
        '1m': '1d',
        '5m': '1d',
        '15m': '1d',
        '1h': '1w',
        '4h': '1m',
        '1d': '1m',
        '1w': '1y',
      });
    });

    it('never opens on a window wider than the first fetched page', () => {
      const timePeriodSpanMs: Record<OhlcvTimePeriod, number> = {
        '1h': HOUR_MS,
        '1d': DAY_MS,
        '1w': 7 * DAY_MS,
        '1m': 30 * DAY_MS,
        '1y': 365 * DAY_MS,
      };
      for (const { visibleWindowMs, timePeriod } of Object.values(
        CANDLE_INTERVAL_CONFIG,
      )) {
        expect(visibleWindowMs).toBeLessThanOrEqual(
          timePeriodSpanMs[timePeriod],
        );
      }
    });
  });

  describe('isCandleInterval / getCandleIntervalConfig', () => {
    it('accepts a known interval', () => {
      expect(isCandleInterval('4h')).toBe(true);
      expect(getCandleIntervalConfig('4h')).toBe(CANDLE_INTERVAL_CONFIG['4h']);
    });

    it.each<string>(['', '2h', '1H', 'toString'])(
      'rejects unknown interval %j',
      (interval) => {
        expect(isCandleInterval(interval)).toBe(false);
        expect(getCandleIntervalConfig(interval)).toBeUndefined();
      },
    );
  });

  describe('getOhlcvTimePeriod', () => {
    it('returns the time period for a known interval', () => {
      expect(getOhlcvTimePeriod('4h')).toBe('1m');
    });

    it.each<string>(['', 'unknown_interval', 'toString'])(
      'falls back to 1d for unknown interval %j',
      (interval) => {
        expect(getOhlcvTimePeriod(interval)).toBe('1d');
      },
    );
  });

  describe('LINE_RANGE_CONFIG', () => {
    it('lists ranges shortest -> longest and defaults to 1D', () => {
      expect(LINE_RANGES).toStrictEqual(['1H', '1D', '1W', '1M', '1Y']);
      expect(DEFAULT_LINE_RANGE).toBe('1D');
    });

    it('has the expected spans and ISO 8601 durations', () => {
      expect(LINE_RANGE_CONFIG).toStrictEqual({
        '1H': { windowMs: HOUR_MS, iso8601: 'PT1H' },
        '1D': { windowMs: DAY_MS, iso8601: 'P1D' },
        '1W': { windowMs: 7 * DAY_MS, iso8601: 'P1W' },
        '1M': { windowMs: 30 * DAY_MS, iso8601: 'P1M' },
        '1Y': { windowMs: 365 * DAY_MS, iso8601: 'P1Y' },
      });
    });

    it.each<string>(['', '1h', 'toString'])(
      'returns undefined for unknown range %j',
      (range) => {
        expect(getLineRangeConfig(range)).toBeUndefined();
      },
    );
  });

  describe('getTvResolution', () => {
    it('returns the resolution for a known interval', () => {
      expect(getTvResolution('4h')).toBe('240');
    });

    it.each<string>(['', '2h', 'toString'])(
      'returns undefined for unknown interval %j',
      (interval) => {
        expect(getTvResolution(interval)).toBeUndefined();
      },
    );
  });

  describe('nearestByWindow', () => {
    const LINE_RANGE_WINDOWS = {
      '1H': HOUR_MS,
      '1D': DAY_MS,
      '1W': 7 * DAY_MS,
      '1M': 30 * DAY_MS,
      '1Y': 365 * DAY_MS,
    };

    it('returns the candidate whose window matches exactly', () => {
      expect(nearestByWindow(DAY_MS, LINE_RANGE_WINDOWS)).toBe('1D');
    });

    it('picks the closest candidate on a ratio scale', () => {
      // 6h is a factor of 6 from 1H but only a factor of 4 from 1D, so 1D wins.
      expect(nearestByWindow(6 * HOUR_MS, LINE_RANGE_WINDOWS)).toBe('1D');
    });

    it('breaks a tie toward the later-listed candidate', () => {
      expect(nearestByWindow(DAY_MS, { a: DAY_MS, b: DAY_MS })).toBe('b');
    });
  });

  describe('mapCandleIntervalToLineRange', () => {
    const intervalToRangeCases: [string, string][] = [
      ['1m', '1H'],
      ['5m', '1D'],
      ['15m', '1D'],
      ['1h', '1W'],
      ['4h', '1W'],
      ['1d', '1M'],
      ['1w', '1Y'],
    ];
    intervalToRangeCases.forEach(([interval, expected]) => {
      it(`maps candle ${interval} to line ${expected}`, () => {
        expect(mapCandleIntervalToLineRange(interval)).toBe(expected);
      });
    });

    it('falls back to 1D for an unknown interval', () => {
      expect(mapCandleIntervalToLineRange('nope')).toBe('1D');
    });
  });

  describe('resolveCandleForLineRange', () => {
    it('keeps the saved interval when it is a sensible fit for the line span', () => {
      // 1h span at 1m bars is 60 candles, well within the cap.
      expect(resolveCandleForLineRange('1H', '1m')).toBe('1m');
      // 1y span at 1w bars is ~52 candles.
      expect(resolveCandleForLineRange('1Y', '1w')).toBe('1w');
    });

    it('steps to the nearest-natural-window interval when the saved one is too fine', () => {
      // A year of 1m candles is ~525k bars, far past the cap, so it steps to the
      // interval whose natural window is nearest a year: 1w.
      expect(resolveCandleForLineRange('1Y', '1m')).toBe('1w');
    });

    const tooFineStepCases: [string, string][] = [
      ['1H', '1m'],
      ['1D', '15m'],
      ['1W', '4h'],
      ['1M', '1d'],
      ['1Y', '1w'],
    ];
    tooFineStepCases.forEach(([lineRange, expected]) => {
      it(`steps a too-fine saved interval toward the ${lineRange} span -> ${expected}`, () => {
        // Saved 1m busts the cap for every span wider than ~1H, so the result
        // is the nearest-natural-window interval for that span. 1H keeps 1m (it
        // fits); the rest step to the nearest-window interval.
        const resolved = resolveCandleForLineRange(lineRange, '1m');
        expect(resolved).toBe(expected);
      });
    });

    it('treats an unknown line range as the 1D span', () => {
      // 1d span, saved 1m busts the cap -> nearest natural window to 1d is 15m.
      expect(resolveCandleForLineRange('nope', '1m')).toBe('15m');
    });
  });
});
