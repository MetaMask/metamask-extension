import type { OrderBookData } from '@metamask/perps-controller';
import { computeSlippagePct } from './useEstimatedSlippage';

function level(price: string, size: string): OrderBookData['asks'][number] {
  const total = size;
  const notional = String(Number(price) * Number(size));
  return { price, size, total, notional, totalNotional: notional };
}

function book(overrides: Partial<OrderBookData> = {}): OrderBookData {
  return {
    bids: [],
    asks: [],
    spread: '0',
    spreadPercentage: '0',
    midPrice: '100',
    lastUpdated: Date.now(),
    maxTotal: '0',
    ...overrides,
  };
}

describe('computeSlippagePct', () => {
  it('returns null + insufficientLiquidity=false when the book has no asks for a long', () => {
    const result = computeSlippagePct(book({ asks: [] }), 100, 'long');
    expect(result).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: false,
    });
  });

  it('computes slippage from the ask side for a long', () => {
    // Notional 210 USD fully consumes 1@100 + 1@110 → avg 105 → 5% above mid.
    const result = computeSlippagePct(
      book({
        asks: [level('100', '1'), level('110', '1')],
        midPrice: '100',
      }),
      210,
      'long',
    );
    expect(result.insufficientLiquidity).toBe(false);
    expect(result.estimatedSlippagePct).toBeCloseTo(5, 5);
  });

  it('computes slippage from the bid side for a short', () => {
    // Notional 190 USD fully consumes 1@100 + 1@90 → avg 95 → 5% below mid.
    const result = computeSlippagePct(
      book({
        bids: [level('100', '1'), level('90', '1')],
        midPrice: '100',
      }),
      190,
      'short',
    );
    expect(result.insufficientLiquidity).toBe(false);
    expect(result.estimatedSlippagePct).toBeCloseTo(5, 5);
  });

  it('returns insufficientLiquidity when the book cannot fill the notional', () => {
    const result = computeSlippagePct(
      book({ asks: [level('100', '1')], midPrice: '100' }),
      1_000_000,
      'long',
    );
    expect(result).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: true,
    });
  });

  it('clamps tiny negative rounding to zero rather than reporting negative slippage', () => {
    // Fill at exactly mid price → 0% (guards against -1e-15 from float math).
    const result = computeSlippagePct(
      book({ asks: [level('100', '10')], midPrice: '100' }),
      100,
      'long',
    );
    expect(result.estimatedSlippagePct).toBe(0);
  });

  it('skips malformed levels rather than throwing', () => {
    const result = computeSlippagePct(
      book({
        asks: [
          level('not-a-number', '1'),
          level('100', '0'),
          level('100', '2'),
        ],
        midPrice: '100',
      }),
      100,
      'long',
    );
    expect(result.estimatedSlippagePct).toBe(0);
  });
});
