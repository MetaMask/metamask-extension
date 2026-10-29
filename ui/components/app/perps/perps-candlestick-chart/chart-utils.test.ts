import type { CandleStick } from '@metamask/perps-controller';
import { CandlePeriod } from '../constants/chartConfig';
import {
  formatChartTimestamp,
  formatSingleCandleForChart,
  formatSingleVolumeForChart,
  formatCandleDataForChart,
  formatVolumeDataForChart,
  clearFormatterCache,
} from './chart-utils';

// Fixed UTC timestamp: 2025-03-15 14:30:00 UTC (a Saturday, unlikely to be "today")
const FIXED_TS_SECONDS = 1742048400;
const FIXED_DATE = new Date(FIXED_TS_SECONDS * 1000);

/**
 * Build locale-specific expected values so assertions stay deterministic
 * regardless of which locale is under test.
 *
 * @param locale - BCP 47 locale tag
 */
function expectedParts(locale: string) {
  return {
    monthShort: new Intl.DateTimeFormat(locale, { month: 'short' }).format(
      FIXED_DATE,
    ),
    day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(FIXED_DATE),
    year: new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(
      FIXED_DATE,
    ),
  };
}

const makeCandle = (overrides: Partial<CandleStick> = {}): CandleStick =>
  ({
    time: 1_700_000_000_000,
    open: '100',
    high: '110',
    low: '90',
    close: '105',
    volume: '50',
    ...overrides,
  }) as CandleStick;

describe('formatSingleCandleForChart', () => {
  it('converts ms timestamp to seconds and parses OHLC strings', () => {
    const result = formatSingleCandleForChart(makeCandle());
    expect(result).toEqual({
      time: 1_700_000_000,
      open: 100,
      high: 110,
      low: 90,
      close: 105,
    });
  });

  it('returns null for NaN OHLC values', () => {
    expect(formatSingleCandleForChart(makeCandle({ open: 'bad' }))).toBeNull();
  });

  it('returns null for zero OHLC values', () => {
    expect(formatSingleCandleForChart(makeCandle({ low: '0' }))).toBeNull();
  });

  it('returns null for negative OHLC values', () => {
    expect(formatSingleCandleForChart(makeCandle({ close: '-5' }))).toBeNull();
  });
});

describe('formatSingleVolumeForChart', () => {
  it('computes USD notional (volume * close) with bullish color', () => {
    const result = formatSingleVolumeForChart(makeCandle(), '#0f0', '#f00');
    expect(result).toEqual({
      time: 1_700_000_000,
      value: 50 * 105,
      color: '#0f0',
    });
  });

  it('uses downColor for bearish candle (close < open)', () => {
    const result = formatSingleVolumeForChart(
      makeCandle({ open: '110', close: '100' }),
      '#0f0',
      '#f00',
    );
    expect(result?.color).toBe('#f00');
  });

  it('returns null when volume is zero', () => {
    expect(
      formatSingleVolumeForChart(makeCandle({ volume: '0' }), '#0f0', '#f00'),
    ).toBeNull();
  });

  it('returns null when volume is missing', () => {
    expect(
      formatSingleVolumeForChart(
        makeCandle({ volume: undefined as unknown as string }),
        '#0f0',
        '#f00',
      ),
    ).toBeNull();
  });
});

describe('formatCandleDataForChart', () => {
  it('returns empty array for null/undefined data', () => {
    expect(formatCandleDataForChart(null as never)).toEqual([]);
    expect(formatCandleDataForChart({ candles: undefined } as never)).toEqual(
      [],
    );
  });

  it('sorts output ascending by time', () => {
    const result = formatCandleDataForChart({
      symbol: 'ETH',
      interval: CandlePeriod.OneHour,
      candles: [
        makeCandle({ time: 2_000_000_000_000 }),
        makeCandle({ time: 1_000_000_000_000 }),
      ],
    });
    expect(result[0].time).toBeLessThan(result[1].time as number);
  });

  it('filters out invalid candles', () => {
    const result = formatCandleDataForChart({
      symbol: 'ETH',
      interval: CandlePeriod.OneHour,
      candles: [makeCandle(), makeCandle({ open: 'NaN' })],
    });
    expect(result).toHaveLength(1);
  });
});

describe('formatVolumeDataForChart', () => {
  it('returns empty array for null/undefined data', () => {
    expect(formatVolumeDataForChart(null as never, '#0f0', '#f00')).toEqual([]);
  });

  it('sorts output ascending by time', () => {
    const result = formatVolumeDataForChart(
      {
        symbol: 'ETH',
        interval: CandlePeriod.OneHour,
        candles: [
          makeCandle({ time: 2_000_000_000_000 }),
          makeCandle({ time: 1_000_000_000_000 }),
        ],
      },
      '#0f0',
      '#f00',
    );
    expect(result[0].time).toBeLessThan(result[1].time as number);
  });
});

describe('formatChartTimestamp', () => {
  beforeEach(() => {
    clearFormatterCache();
  });

  // Run every formatting assertion for two distinct locales to prove the
  // locale parameter is actually threaded through to Intl.DateTimeFormat.
  const locales: string[] = ['en-US', 'de-DE'];

  locales.forEach((locale) => {
    describe(`locale ${locale}`, () => {
      const parts = expectedParts(locale);

      describe('crosshair mode', () => {
        it('returns short month, day, and 24h time', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            null,
            true,
            locale,
          );
          expect(result).toContain(parts.monthShort);
          expect(result).toContain(parts.day);
          expect(result).toMatch(/\d{2}:\d{2}/u);
        });
      });

      describe('tickMarkType as number (lightweight-charts v5 enum)', () => {
        it('0 (Year) returns a 4-digit year', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            0,
            false,
            locale,
          );
          expect(result).toContain(parts.year);
        });

        it('1 (Month) returns abbreviated month name', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            1,
            false,
            locale,
          );
          expect(result).toContain(parts.monthShort);
        });

        it('2 (DayOfMonth) returns month/day', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            2,
            false,
            locale,
          );
          expect(result).toContain(parts.day);
          expect(result).toContain(parts.monthShort);
        });

        it('3 (Time) returns 24h time, with date for non-today dates', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            3,
            false,
            locale,
          );
          expect(result).toContain(parts.day);
          expect(result).toMatch(/\d{2}:\d{2}/u);
        });

        it('4 (TimeWithSeconds) returns HH:MM:SS', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            4,
            false,
            locale,
          );
          expect(result).toMatch(/\d{2}:\d{2}:\d{2}/u);
        });
      });

      describe('tickMarkType as string', () => {
        it('"Year" returns 4-digit year', () => {
          expect(
            formatChartTimestamp(
              FIXED_TS_SECONDS,
              'Year' as never,
              false,
              locale,
            ),
          ).toContain(parts.year);
        });

        it('"Month" returns abbreviated month', () => {
          expect(
            formatChartTimestamp(
              FIXED_TS_SECONDS,
              'Month' as never,
              false,
              locale,
            ),
          ).toContain(parts.monthShort);
        });
      });

      describe('fallback', () => {
        it('null tickMarkType without crosshair returns date + time', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            null,
            false,
            locale,
          );
          expect(result).toContain(parts.day);
          expect(result).toMatch(/\d{2}:\d{2}/u);
        });

        it('unknown numeric tickMarkType falls through to default', () => {
          const result = formatChartTimestamp(
            FIXED_TS_SECONDS,
            99,
            false,
            locale,
          );
          expect(result).toContain(parts.day);
          expect(result).toMatch(/\d{2}:\d{2}/u);
        });
      });
    });
  });

  it('produces different output for different locales (month name)', () => {
    const enMonth = formatChartTimestamp(FIXED_TS_SECONDS, 1, false, 'en-US');
    const deMonth = formatChartTimestamp(FIXED_TS_SECONDS, 1, false, 'de-DE');
    expect(enMonth).not.toBe(deMonth);
  });

  it('patches bare-numeric month in Czech crosshair to abbreviated name', () => {
    const csMonthName = new Intl.DateTimeFormat('cs', {
      month: 'short',
    }).format(FIXED_DATE);
    const crosshair = formatChartTimestamp(FIXED_TS_SECONDS, null, true, 'cs');
    expect(crosshair).toContain(csMonthName);
  });

  it('patches bare-numeric month in Czech DayOfMonth to abbreviated name', () => {
    const csMonthName = new Intl.DateTimeFormat('cs', {
      month: 'short',
    }).format(FIXED_DATE);
    const dayOfMonth = formatChartTimestamp(FIXED_TS_SECONDS, 2, false, 'cs');
    expect(dayOfMonth).toContain(csMonthName);
  });

  it('formats midnight as 00:00 not 24:00 (h23 hour-cycle)', () => {
    clearFormatterCache();
    const localMidnight = new Date(2025, 0, 15, 0, 0, 0, 0);
    const midnightSeconds = Math.floor(localMidnight.getTime() / 1000);
    const result = formatChartTimestamp(midnightSeconds, 4, false, 'en-US');
    expect(result).toMatch(/^00:00:00$/u);
  });
});
