import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  ORDER_BOOK_DEFAULT_WIDTH_PCT,
  ORDER_BOOK_MAX_WIDTH_PCT,
  ORDER_BOOK_MIN_WIDTH_PCT,
  calculateAggregationParams,
  calculateGroupingOptions,
  clampOrderBookWidthPct,
  computeOrderBookWidthPct,
  formatColumnValue,
  formatGroupingLabel,
  formatSpreadPercent,
  getDepthRatio,
  getDepthWidth,
  getOrderBookMaxWidthPct,
  groupOrderBook,
  selectDefaultGrouping,
} from './order-book.utils';

const level = (
  price: string,
  size: string,
  notional: string,
  total = size,
  totalNotional = notional,
): OrderBookLevel => ({ price, size, total, notional, totalNotional });

describe('order-book.utils', () => {
  describe('calculateGroupingOptions', () => {
    it('anchors a 1-2-5 ladder to the price magnitude', () => {
      expect(calculateGroupingOptions(87000)).toStrictEqual([
        1, 2, 5, 10, 100, 1000,
      ]);
    });

    it('scales the ladder down for low-priced assets', () => {
      const options = calculateGroupingOptions(33);
      const expected = [0.001, 0.002, 0.005, 0.01, 0.1, 1];
      options.forEach((value, index) =>
        expect(value).toBeCloseTo(expected[index], 6),
      );
    });

    it('returns a safe default ladder for non-positive or non-finite prices', () => {
      expect(calculateGroupingOptions(0)).toStrictEqual([0.01, 0.1, 1]);
      expect(calculateGroupingOptions(Number.NaN)).toStrictEqual([
        0.01, 0.1, 1,
      ]);
    });
  });

  describe('calculateAggregationParams', () => {
    it('maps a coarse grouping to a lower nSigFigs (ETH at ~$1,752, group $10)', () => {
      // The bug case: $10 grouping on ETH. Server-side nSigFigs=3 keeps ~$10
      // steps while returning many levels across the book.
      expect(calculateAggregationParams(10, 1752.8)).toStrictEqual({
        nSigFigs: 3,
      });
    });

    it('uses full precision (nSigFigs 5) for the finest grouping', () => {
      // ETH's finest ladder increment is $0.1 → full 5 sig figs of ~$1,752.
      expect(calculateAggregationParams(0.1, 1752.8)).toStrictEqual({
        nSigFigs: 5,
      });
      // A $1 grouping keeps 4 sig figs (~$1 steps).
      expect(calculateAggregationParams(1, 1752.8)).toStrictEqual({
        nSigFigs: 4,
      });
    });

    it('adds a mantissa for 2x / 5x steps at full precision', () => {
      // BTC at ~$87k: $2 step → mantissa 2, $5 step → mantissa 5.
      expect(calculateAggregationParams(2, 87000)).toStrictEqual({
        nSigFigs: 5,
        mantissa: 2,
      });
      expect(calculateAggregationParams(5, 87000)).toStrictEqual({
        nSigFigs: 5,
        mantissa: 5,
      });
      expect(calculateAggregationParams(1, 87000)).toStrictEqual({
        nSigFigs: 5,
      });
    });

    it('clamps nSigFigs to the API-supported 2-5 range', () => {
      const { nSigFigs } = calculateAggregationParams(1000, 87000);
      expect(nSigFigs).toBeGreaterThanOrEqual(2);
      expect(nSigFigs).toBeLessThanOrEqual(5);
    });

    it('falls back to nSigFigs 5 for invalid inputs', () => {
      expect(calculateAggregationParams(10, 0)).toStrictEqual({ nSigFigs: 5 });
      expect(calculateAggregationParams(0, 1752)).toStrictEqual({
        nSigFigs: 5,
      });
      expect(calculateAggregationParams(Number.NaN, 1752)).toStrictEqual({
        nSigFigs: 5,
      });
    });
  });

  describe('formatGroupingLabel', () => {
    it('adds thousands separators for values >= 1', () => {
      expect(formatGroupingLabel(1)).toBe('1');
      expect(formatGroupingLabel(1000)).toBe('1,000');
    });

    it('renders sub-unit increments with the required decimals', () => {
      expect(formatGroupingLabel(0.001)).toBe('0.001');
      expect(formatGroupingLabel(0.01)).toBe('0.01');
    });
  });

  describe('selectDefaultGrouping', () => {
    it('prefers the mid-range (index 3) option', () => {
      expect(selectDefaultGrouping([1, 2, 5, 10, 100, 1000])).toBe(10);
    });

    it('falls back to the middle option, then the first, then 1', () => {
      expect(selectDefaultGrouping([1, 2])).toBe(2);
      expect(selectDefaultGrouping([7])).toBe(7);
      expect(selectDefaultGrouping([])).toBe(1);
    });
  });

  describe('groupOrderBook', () => {
    it('trims to the display depth and reports the deepest cumulative total', () => {
      const bids = Array.from({ length: 15 }, (_, index) =>
        level(
          `${100 - index}`,
          '1',
          '10',
          `${index + 1}`,
          `${(index + 1) * 10}`,
        ),
      );
      const asks = Array.from({ length: 15 }, (_, index) =>
        level(
          `${101 + index}`,
          '1',
          '10',
          `${index + 1}`,
          `${(index + 1) * 10}`,
        ),
      );

      const grouped = groupOrderBook({
        bids,
        asks,
        spread: '1',
        spreadPercentage: '0.01',
        midPrice: '100.5',
        lastUpdated: 1,
        maxTotal: '15',
      });

      expect(grouped.bids).toHaveLength(10);
      expect(grouped.asks).toHaveLength(10);
      expect(grouped.maxTotal).toBe(10);
    });
  });

  describe('getDepthWidth', () => {
    it('scales the width against the deepest level and caps at 100', () => {
      expect(getDepthWidth(level('1', '1', '1', '5'), 10)).toBe(50);
      expect(getDepthWidth(level('1', '1', '1', '20'), 10)).toBe(100);
    });

    it('returns 0 when maxTotal is missing or the total is invalid', () => {
      expect(getDepthWidth(level('1', '1', '1', '5'), 0)).toBe(0);
      expect(getDepthWidth(level('1', '1', '1', 'bad'), 10)).toBe(0);
    });
  });

  describe('formatColumnValue', () => {
    it('formats base amounts with the shared size formatter (honoring szDecimals)', () => {
      expect(formatColumnValue(level('1', '1.5', '150'), 'base', 'size')).toBe(
        '1.5',
      );
      expect(
        formatColumnValue(level('1', '1.234', '150'), 'base', 'size', 2),
      ).toBe('1.23');
    });

    it('formats sub-threshold USD totals as full fiat amounts', () => {
      expect(
        formatColumnValue(level('1', '1', '1200', '2', '2400'), 'usd', 'total'),
      ).toBe('$2,400');
    });

    it('formats large USD totals with compact notation', () => {
      expect(
        formatColumnValue(
          level('1', '1', '1200', '2', '52714'),
          'usd',
          'total',
        ),
      ).toBe('$53K');
    });

    it('returns the fallback display for unparseable USD values', () => {
      expect(
        formatColumnValue(level('1', '1', 'bad', '1', 'bad'), 'usd', 'total'),
      ).toBe('--');
    });
  });

  describe('formatSpreadPercent', () => {
    it('formats a spread percentage to three decimals with a percent sign', () => {
      expect(formatSpreadPercent(0.0027)).toBe('0.003%');
      expect(formatSpreadPercent(0.05)).toBe('0.05%');
      expect(formatSpreadPercent(1)).toBe('1%');
    });

    it('strips trailing zeros', () => {
      expect(formatSpreadPercent(0.1)).toBe('0.1%');
    });

    it('returns the fallback display for non-finite input', () => {
      expect(formatSpreadPercent(Number.NaN)).toBe('--');
    });
  });

  describe('getDepthRatio', () => {
    it('splits buy/sell depth into percentages summing to 100', () => {
      const ratio = getDepthRatio(
        [level('1', '1', '1', '30')],
        [level('2', '1', '1', '10')],
      );
      expect(ratio).toStrictEqual({ buyPercent: 75, sellPercent: 25 });
    });

    it('returns null when there is no depth on either side', () => {
      expect(getDepthRatio([], [])).toBeNull();
    });
  });

  describe('clampOrderBookWidthPct', () => {
    it('keeps the width within the allowed bounds', () => {
      expect(clampOrderBookWidthPct(10)).toBe(ORDER_BOOK_MIN_WIDTH_PCT);
      expect(clampOrderBookWidthPct(80)).toBe(ORDER_BOOK_MAX_WIDTH_PCT);
      expect(clampOrderBookWidthPct(40)).toBe(40);
    });

    it('falls back to the default width for non-finite input', () => {
      expect(clampOrderBookWidthPct(Number.NaN)).toBe(
        ORDER_BOOK_DEFAULT_WIDTH_PCT,
      );
    });

    it('caps the width so the form keeps its pixel floor on a narrow body', () => {
      // Body 400px: order book may take at most (400 - 224 form - 2 divider) =
      // 174px => 43.5%. A request for the 60% max is capped to 43.5% so the
      // panel does not overflow off-screen.
      expect(clampOrderBookWidthPct(60, 400)).toBeCloseTo(43.5, 5);
    });

    it('does not cap below the percentage floor on a very narrow body', () => {
      // Body 280px: the pixel-derived ceiling (~18.5%) is below the 22% floor,
      // so the floor wins and the overflow-x fallback handles the rest.
      expect(clampOrderBookWidthPct(60, 280)).toBe(ORDER_BOOK_MIN_WIDTH_PCT);
    });

    it('leaves the percentage max intact on a wide body', () => {
      expect(clampOrderBookWidthPct(80, 2000)).toBe(ORDER_BOOK_MAX_WIDTH_PCT);
    });
  });

  describe('getOrderBookMaxWidthPct', () => {
    it('returns the constant percentage max without a container width', () => {
      expect(getOrderBookMaxWidthPct()).toBe(ORDER_BOOK_MAX_WIDTH_PCT);
    });

    it('returns the pixel-aware ceiling on a narrow popup body', () => {
      // Body 360px: (360 - 224 form - 2 divider) / 360 ≈ 37.22%.
      expect(getOrderBookMaxWidthPct(360)).toBeCloseTo(37.222, 2);
    });

    it('does not drop below the percentage floor on a very narrow body', () => {
      expect(getOrderBookMaxWidthPct(280)).toBe(ORDER_BOOK_MIN_WIDTH_PCT);
    });
  });

  describe('computeOrderBookWidthPct', () => {
    it('derives the clamped width from the pointer position', () => {
      expect(computeOrderBookWidthPct(1000, 1000, 700)).toBe(30);
      expect(computeOrderBookWidthPct(1000, 1000, 100)).toBe(
        ORDER_BOOK_MAX_WIDTH_PCT,
      );
    });

    it('falls back to the default width when the container has no width', () => {
      expect(computeOrderBookWidthPct(1000, 0, 700)).toBe(
        ORDER_BOOK_DEFAULT_WIDTH_PCT,
      );
    });

    it('caps the width to the form pixel floor when dragged far on a narrow body', () => {
      // Body 400px wide (right edge at 400). Dragging the pointer to x=0 would
      // request 100%, but the form's pixel floor caps it at 43.5%.
      expect(computeOrderBookWidthPct(400, 400, 0)).toBeCloseTo(43.5, 5);
    });
  });
});
