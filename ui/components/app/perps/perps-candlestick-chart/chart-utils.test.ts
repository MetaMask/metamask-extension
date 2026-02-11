import { brandColor } from '@metamask/design-tokens';
import type { CandleData, CandleStick } from '@metamask/perps-controller';
import {
  formatSingleCandleForChart,
  formatSingleVolumeForChart,
  formatCandleDataForChart,
  formatVolumeDataForChart,
} from './chart-utils';

const createMockCandle = (overrides: Partial<CandleStick> = {}): CandleStick =>
  ({
    time: 1700000000000, // ms
    open: '100.5',
    high: '105.0',
    low: '99.0',
    close: '103.0',
    volume: '500',
    ...overrides,
  }) as CandleStick;

describe('chart-utils', () => {
  describe('formatSingleCandleForChart', () => {
    it('converts candle time from milliseconds to seconds', () => {
      const candle = createMockCandle({ time: 1700000000000 });
      const result = formatSingleCandleForChart(candle);

      expect(result).not.toBeNull();
      expect(result?.time).toBe(1700000000);
    });

    it('parses OHLC string values to numbers', () => {
      const candle = createMockCandle({
        open: '100.5',
        high: '105.0',
        low: '99.0',
        close: '103.0',
      });
      const result = formatSingleCandleForChart(candle);

      expect(result).not.toBeNull();
      expect(result?.open).toBe(100.5);
      expect(result?.high).toBe(105.0);
      expect(result?.low).toBe(99.0);
      expect(result?.close).toBe(103.0);
    });

    it('returns null for candle with NaN open value', () => {
      const candle = createMockCandle({ open: 'invalid' });
      const result = formatSingleCandleForChart(candle);

      expect(result).toBeNull();
    });

    it('returns null for candle with NaN high value', () => {
      const candle = createMockCandle({ high: 'abc' });
      const result = formatSingleCandleForChart(candle);

      expect(result).toBeNull();
    });

    it('returns null for candle with zero close value', () => {
      const candle = createMockCandle({ close: '0' });
      const result = formatSingleCandleForChart(candle);

      expect(result).toBeNull();
    });

    it('returns null for candle with negative low value', () => {
      const candle = createMockCandle({ low: '-5' });
      const result = formatSingleCandleForChart(candle);

      expect(result).toBeNull();
    });

    it('floors time when converting from milliseconds', () => {
      const candle = createMockCandle({ time: 1700000000500 });
      const result = formatSingleCandleForChart(candle);

      expect(result?.time).toBe(1700000000);
    });
  });

  describe('formatSingleVolumeForChart', () => {
    it('calculates USD notional value (volume * close)', () => {
      const candle = createMockCandle({ volume: '10', close: '100' });
      const result = formatSingleVolumeForChart(candle);

      expect(result).not.toBeNull();
      expect(result?.value).toBe(1000);
    });

    it('uses green color for bullish candle (close >= open)', () => {
      const candle = createMockCandle({ open: '100', close: '105' });
      const result = formatSingleVolumeForChart(candle);

      expect(result?.color).toBe(brandColor.lime100);
    });

    it('uses red color for bearish candle (close < open)', () => {
      const candle = createMockCandle({ open: '105', close: '100' });
      const result = formatSingleVolumeForChart(candle);

      expect(result?.color).toBe(brandColor.red300);
    });

    it('uses green color when close equals open', () => {
      const candle = createMockCandle({ open: '100', close: '100' });
      const result = formatSingleVolumeForChart(candle);

      expect(result?.color).toBe(brandColor.lime100);
    });

    it('returns null for zero volume', () => {
      const candle = createMockCandle({ volume: '0', close: '100' });
      const result = formatSingleVolumeForChart(candle);

      expect(result).toBeNull();
    });

    it('returns null for invalid volume', () => {
      const candle = createMockCandle({ volume: 'invalid' });
      const result = formatSingleVolumeForChart(candle);

      expect(result).toBeNull();
    });

    it('defaults to 0 volume when volume is undefined', () => {
      const candle = createMockCandle({ volume: undefined });
      const result = formatSingleVolumeForChart(candle);

      expect(result).toBeNull();
    });

    it('converts time from milliseconds to seconds', () => {
      const candle = createMockCandle({ time: 1700000000000 });
      const result = formatSingleVolumeForChart(candle);

      expect(result?.time).toBe(1700000000);
    });
  });

  describe('formatCandleDataForChart', () => {
    it('formats array of candles and sorts ascending by time', () => {
      const data: CandleData = {
        candles: [
          createMockCandle({ time: 1700000002000 }),
          createMockCandle({ time: 1700000001000 }),
          createMockCandle({ time: 1700000003000 }),
        ],
      } as CandleData;

      const result = formatCandleDataForChart(data);

      expect(result).toHaveLength(3);
      expect(result[0].time).toBe(1700000001);
      expect(result[1].time).toBe(1700000002);
      expect(result[2].time).toBe(1700000003);
    });

    it('filters out invalid candles', () => {
      const data: CandleData = {
        candles: [
          createMockCandle({ time: 1700000001000 }),
          createMockCandle({ time: 1700000002000, open: 'invalid' }),
          createMockCandle({ time: 1700000003000 }),
        ],
      } as CandleData;

      const result = formatCandleDataForChart(data);

      expect(result).toHaveLength(2);
    });

    it('returns empty array when data is null', () => {
      const result = formatCandleDataForChart(null as unknown as CandleData);

      expect(result).toEqual([]);
    });

    it('returns empty array when candles property is missing', () => {
      const result = formatCandleDataForChart({} as CandleData);

      expect(result).toEqual([]);
    });

    it('returns empty array when all candles are invalid', () => {
      const data: CandleData = {
        candles: [
          createMockCandle({ open: 'invalid' }),
          createMockCandle({ close: '0' }),
        ],
      } as CandleData;

      const result = formatCandleDataForChart(data);

      expect(result).toEqual([]);
    });
  });

  describe('formatVolumeDataForChart', () => {
    it('formats array of volume data and sorts ascending by time', () => {
      const data: CandleData = {
        candles: [
          createMockCandle({
            time: 1700000002000,
            volume: '10',
            close: '100',
          }),
          createMockCandle({
            time: 1700000001000,
            volume: '20',
            close: '100',
          }),
        ],
      } as CandleData;

      const result = formatVolumeDataForChart(data);

      expect(result).toHaveLength(2);
      expect(result[0].time).toBe(1700000001);
      expect(result[1].time).toBe(1700000002);
    });

    it('filters out entries with zero volume', () => {
      const data: CandleData = {
        candles: [
          createMockCandle({
            time: 1700000001000,
            volume: '10',
            close: '100',
          }),
          createMockCandle({
            time: 1700000002000,
            volume: '0',
            close: '100',
          }),
        ],
      } as CandleData;

      const result = formatVolumeDataForChart(data);

      expect(result).toHaveLength(1);
    });

    it('returns empty array when data is null', () => {
      const result = formatVolumeDataForChart(null as unknown as CandleData);

      expect(result).toEqual([]);
    });

    it('returns empty array when candles is missing', () => {
      const result = formatVolumeDataForChart({} as CandleData);

      expect(result).toEqual([]);
    });
  });
});
