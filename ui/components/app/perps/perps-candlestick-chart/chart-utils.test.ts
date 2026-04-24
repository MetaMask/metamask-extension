import type { CandleStick } from '@metamask/perps-controller';
import {
  formatChartTimestamp,
  formatSingleCandleForChart,
  formatSingleVolumeForChart,
  formatCandleDataForChart,
  formatVolumeDataForChart,
} from './chart-utils';

// Fixed UTC timestamp: 2025-03-15 14:30:00 UTC (a Saturday, unlikely to be "today")
const FIXED_TS_SECONDS = 1742048400;

// The production formatters use the system's local timezone, so expected date
// components must be derived in the same timezone to keep tests deterministic.
const FIXED_DATE = new Date(FIXED_TS_SECONDS * 1000);
const EXPECTED_MONTH_SHORT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
}).format(FIXED_DATE);
const EXPECTED_DAY = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
}).format(FIXED_DATE);
const EXPECTED_MONTH_NUMERIC = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
}).format(FIXED_DATE);
const EXPECTED_YEAR = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
}).format(FIXED_DATE);

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
      interval: '1h',
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
      interval: '1h',
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
        interval: '1h',
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
  describe('crosshair mode', () => {
    it('returns short month, day, and 24h time', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, null, true);
      expect(result).toContain(EXPECTED_MONTH_SHORT);
      expect(result).toContain(EXPECTED_DAY);
      expect(result).toMatch(/\d{2}:\d{2}/u);
    });
  });

  describe('tickMarkType as number (lightweight-charts v5 enum)', () => {
    it('0 (Year) returns a 4-digit year', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 0);
      expect(result).toContain(EXPECTED_YEAR);
    });

    it('1 (Month) returns abbreviated month name', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 1);
      expect(result).toContain(EXPECTED_MONTH_SHORT);
    });

    it('2 (DayOfMonth) returns month/day', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 2);
      expect(result).toContain(`${EXPECTED_MONTH_NUMERIC}/${EXPECTED_DAY}`);
    });

    it('3 (Time) returns 24h time, with month/day for non-today dates', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 3);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/u);
      expect(result).toMatch(/\d{2}:\d{2}/u);
    });

    it('4 (TimeWithSeconds) returns HH:MM:SS', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 4);
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/u);
    });
  });

  describe('tickMarkType as string', () => {
    it('"Year" returns 4-digit year', () => {
      expect(formatChartTimestamp(FIXED_TS_SECONDS, 'Year' as never)).toContain(
        EXPECTED_YEAR,
      );
    });

    it('"Month" returns abbreviated month', () => {
      expect(
        formatChartTimestamp(FIXED_TS_SECONDS, 'Month' as never),
      ).toContain(EXPECTED_MONTH_SHORT);
    });
  });

  describe('fallback', () => {
    it('null tickMarkType without crosshair returns month/day + time', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, null, false);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/u);
      expect(result).toMatch(/\d{2}:\d{2}/u);
    });

    it('unknown numeric tickMarkType falls through to default', () => {
      const result = formatChartTimestamp(FIXED_TS_SECONDS, 99);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}/u);
      expect(result).toMatch(/\d{2}:\d{2}/u);
    });
  });
});
