import {
  getTvResolution,
  INTERVAL_DURATION_MS,
  INTERVAL_TO_TV_RESOLUTION,
  LINE_RANGE_MS,
  mapCandleIntervalToLineRange,
  nearestByWindow,
  resolveCandleForLineRange,
  VISIBLE_WINDOW_MS_BY_INTERVAL,
} from './chart-window-mapping';

describe('chart-window-mapping', () => {
  describe('INTERVAL_TO_TV_RESOLUTION', () => {
    it('maps every supported candle interval', () => {
      const intervals = Object.keys(INTERVAL_TO_TV_RESOLUTION).sort();
      expect(intervals).toStrictEqual(Object.keys(INTERVAL_DURATION_MS).sort());
      expect(intervals).toStrictEqual(
        Object.keys(VISIBLE_WINDOW_MS_BY_INTERVAL).sort(),
      );
    });

    it('uses TradingView resolution format (hours as minutes)', () => {
      expect(INTERVAL_TO_TV_RESOLUTION).toStrictEqual({
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '1h': '60',
        '4h': '240',
        '1d': '1D',
        '1w': '1W',
      });
    });
  });

  describe('getTvResolution', () => {
    it('returns the resolution for a known interval', () => {
      expect(getTvResolution('4h')).toBe('240');
    });

    it.each(['', '2h', 'toString'])(
      'returns undefined for unknown interval %j',
      (interval) => {
        expect(getTvResolution(interval)).toBeUndefined();
      },
    );
  });

  describe('nearestByWindow', () => {
    it('returns the candidate whose window matches exactly', () => {
      expect(nearestByWindow(LINE_RANGE_MS['1D'], LINE_RANGE_MS)).toBe('1D');
    });

    it('picks the closest candidate on a ratio scale', () => {
      // 6h is a factor of 6 from 1H but only a factor of 4 from 1D, so 1D wins.
      const sixHoursMs = 6 * 60 * 60 * 1000;
      expect(nearestByWindow(sixHoursMs, LINE_RANGE_MS)).toBe('1D');
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
