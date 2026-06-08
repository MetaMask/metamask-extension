import type { OrderBookData, OrderBookLevel } from '@metamask/perps-controller';
import { calculateEstimatedSlippageBps } from './slippageCalculation';

const level = (price: number, size: number): OrderBookLevel => ({
  price: String(price),
  size: String(size),
  total: String(size),
  notional: String(price * size),
  totalNotional: String(price * size),
});

const buildBook = (
  midPrice: number,
  asks: OrderBookLevel[],
  bids: OrderBookLevel[],
): OrderBookData => ({
  midPrice: String(midPrice),
  asks,
  bids,
  spread: '0',
  spreadPercentage: '0',
  lastUpdated: 0,
  maxTotal: '0',
});

describe('calculateEstimatedSlippageBps', () => {
  it('returns null when order book is missing', () => {
    expect(
      calculateEstimatedSlippageBps({
        orderBook: null,
        sizeUsd: 100,
        isBuy: true,
      }),
    ).toBeNull();
  });

  it('returns null when size is zero', () => {
    const book = buildBook(100, [level(101, 10)], [level(99, 10)]);
    expect(
      calculateEstimatedSlippageBps({
        orderBook: book,
        sizeUsd: 0,
        isBuy: true,
      }),
    ).toBeNull();
  });

  it('returns the exact bps for a buy that walks two ask levels', () => {
    const book = buildBook(100, [level(100, 10), level(110, 10)], []);
    const result = calculateEstimatedSlippageBps({
      orderBook: book,
      sizeUsd: 1500,
      isBuy: true,
    });
    expect(result).not.toBeNull();
    expect(result as number).toBeCloseTo(333.333, 2);
  });

  it('returns the exact bps for a sell that walks two bid levels', () => {
    const book = buildBook(100, [], [level(100, 10), level(90, 10)]);
    const result = calculateEstimatedSlippageBps({
      orderBook: book,
      sizeUsd: 1500,
      isBuy: false,
    });
    expect(result).not.toBeNull();
    expect(result as number).toBeCloseTo(333.333, 2);
  });
});
