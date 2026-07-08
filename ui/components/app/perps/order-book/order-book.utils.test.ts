import type { OrderBookLevel } from '@metamask/perps-controller';
import {
  ORDER_BOOK_DEFAULT_WIDTH_PCT,
  ORDER_BOOK_MAX_WIDTH_PCT,
  ORDER_BOOK_MIN_WIDTH_PCT,
  aggregateOrderBookLevels,
  calculateGroupingOptions,
  clampOrderBookWidthPct,
  computeOrderBookWidthPct,
  formatColumnValue,
  formatGroupingLabel,
  formatSpreadBps,
  getDepthRatio,
  getDepthWidth,
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

  describe('aggregateOrderBookLevels', () => {
    it('floors bid prices into buckets and accumulates size/notional', () => {
      const result = aggregateOrderBookLevels(
        [level('105', '1', '105'), level('104', '2', '208'), level('96', '3', '288')],
        10,
        'bid',
      );

      expect(result).toStrictEqual([
        {
          price: '100',
          size: '3',
          total: '3',
          notional: '313',
          totalNotional: '313',
        },
        {
          price: '90',
          size: '3',
          total: '6',
          notional: '288',
          totalNotional: '601',
        },
      ]);
    });

    it('ceils ask prices into buckets sorted ascending', () => {
      const result = aggregateOrderBookLevels(
        [level('101', '1', '101'), level('109', '1', '109'), level('111', '2', '222')],
        10,
        'ask',
      );

      expect(result.map((entry) => entry.price)).toStrictEqual(['110', '120']);
      expect(result[0].size).toBe('2');
      expect(result[1].total).toBe('4');
    });

    it('treats non-finite size/notional as 0 and skips invalid prices', () => {
      const result = aggregateOrderBookLevels(
        [
          level('105', 'not-a-number', 'nope'),
          level('bad-price', '5', '500'),
          level('104', '2', '208'),
        ],
        10,
        'bid',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        price: '100',
        size: '2',
        total: '2',
        notional: '208',
        totalNotional: '208',
      });
    });

    it('does not aggregate when grouping size is invalid', () => {
      const levels = [level('105', '1', '105')];
      expect(aggregateOrderBookLevels(levels, 0, 'bid')).toBe(levels);
      expect(aggregateOrderBookLevels(levels, Number.NaN, 'bid')).toBe(levels);
    });
  });

  describe('groupOrderBook', () => {
    it('trims to the display depth and reports the deepest cumulative total', () => {
      const bids = Array.from({ length: 15 }, (_, index) =>
        level(`${100 - index}`, '1', '10', `${index + 1}`, `${(index + 1) * 10}`),
      );
      const asks = Array.from({ length: 15 }, (_, index) =>
        level(`${101 + index}`, '1', '10', `${index + 1}`, `${(index + 1) * 10}`),
      );

      const grouped = groupOrderBook(
        {
          bids,
          asks,
          spread: '1',
          spreadPercentage: '0.01',
          midPrice: '100.5',
          lastUpdated: 1,
          maxTotal: '15',
        },
        null,
      );

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

    it('formats USD totals with a currency prefix', () => {
      expect(
        formatColumnValue(
          level('1', '1', '1200', '2', '2400'),
          'usd',
          'total',
        ),
      ).toMatch(/^\$/u);
    });

    it('returns the fallback display for unparseable USD values', () => {
      expect(
        formatColumnValue(level('1', '1', 'bad', '1', 'bad'), 'usd', 'total'),
      ).toBe('--');
    });
  });

  describe('formatSpreadBps', () => {
    it('converts a spread percentage to one-decimal basis points', () => {
      expect(formatSpreadBps(0.0027)).toBe('0.3');
      expect(formatSpreadBps(0.05)).toBe('5');
    });

    it('returns the fallback display for non-finite input', () => {
      expect(formatSpreadBps(Number.NaN)).toBe('--');
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
  });
});
