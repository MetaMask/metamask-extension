import BigNumber from 'bignumber.js';
import {
  DUST_THRESHOLD,
  moneyFormatUsd,
  moneyFormatUsdSpendable,
} from './format';

describe('moneyFormatUsd', () => {
  // Vectors derived from mobile's `moneyFormatUsd`
  // (`app/components/UI/Money/utils/moneyFormatFiat.ts`) run against the same
  // inputs. Output must stay byte-identical to mobile's.
  const vectors: [string, string][] = [
    // Zero and sub-cent dust both collapse to $0.00 — never `<$0.01`.
    ['0', '$0.00'],
    ['0.001', '$0.00'],
    ['0.004', '$0.00'],
    ['0.009999999', '$0.00'],
    // At and above one cent, ordinary rounding applies.
    ['0.01', '$0.01'],
    ['0.014', '$0.01'],
    ['0.015', '$0.02'],
    ['1', '$1.00'],
    ['1.005', '$1.01'],
    ['12.3', '$12.30'],
    // Large values are grouped, never abbreviated.
    ['1234.56', '$1,234.56'],
    ['1234567.891', '$1,234,567.89'],
    ['1000000000', '$1,000,000,000.00'],
    ['123456789012.34', '$123,456,789,012.34'],
  ];

  it('matches mobile output for the shared vectors', () => {
    for (const [input, expected] of vectors) {
      expect(moneyFormatUsd(new BigNumber(input))).toBe(expected);
    }
  });

  it('collapses negative dust to zero', () => {
    expect(moneyFormatUsd(new BigNumber('-0.005'))).toBe('$0.00');
  });

  it('renders a non-dust negative value the way mobile does', () => {
    // Money balances are never negative, so this is parity with mobile's
    // threshold formatter rather than a deliberate presentation choice: any
    // value below the threshold, including negatives, renders as `<$0.01`.
    expect(moneyFormatUsd(new BigNumber('-5'))).toBe('<$0.01');
  });

  it('formats a NaN value as an empty string', () => {
    // Reachable through arithmetic on an unparsed amount. Note bignumber 4
    // throws on a non-numeric *string* rather than producing NaN, so the NaN
    // has to be produced numerically.
    expect(moneyFormatUsd(new BigNumber(0).dividedBy(0))).toBe('');
  });

  it('ignores the user locale and currency', () => {
    // The value is mUSD, which is USD-pegged, so the output is dollars
    // regardless of the wallet's display currency.
    expect(moneyFormatUsd(new BigNumber('1234.5'))).toBe('$1,234.50');
  });

  it('exposes the dust threshold as one cent', () => {
    expect(DUST_THRESHOLD).toBe(0.01);
  });
});

describe('moneyFormatUsdSpendable', () => {
  it('never rounds a spendable balance up', () => {
    // Regression: CONF-2196. A $0.50 deposit credits 499,999 micro-units, and
    // half-up rounding advertised `$0.50` — a cent more than held. The amount
    // field only accepts two decimals, so `0.50` was the smallest typable
    // match and it failed the balance check, blocking the withdraw entirely.
    const vectors: [string, string][] = [
      ['0.499999', '$0.49'],
      ['0.495', '$0.49'],
      ['1.009', '$1.00'],
      ['1.005', '$1.00'],
      ['0.015', '$0.01'],
      ['12.349999', '$12.34'],
    ];

    for (const [input, expected] of vectors) {
      expect(moneyFormatUsdSpendable(new BigNumber(input))).toBe(expected);
    }
  });

  it('leaves an exact-cent balance untouched', () => {
    const vectors: [string, string][] = [
      ['0', '$0.00'],
      ['0.49', '$0.49'],
      ['0.5', '$0.50'],
      ['12.34', '$12.34'],
      ['1234.56', '$1,234.56'],
    ];

    for (const [input, expected] of vectors) {
      expect(moneyFormatUsdSpendable(new BigNumber(input))).toBe(expected);
    }
  });

  it('still collapses sub-cent dust to zero rather than rounding it up', () => {
    expect(moneyFormatUsdSpendable(new BigNumber('0.009999999'))).toBe('$0.00');
    expect(moneyFormatUsdSpendable(new BigNumber('0.004'))).toBe('$0.00');
  });

  it('formats a NaN value as an empty string', () => {
    expect(moneyFormatUsdSpendable(new BigNumber(0).dividedBy(0))).toBe('');
  });

  it('is always less than or equal to the half-up formatting', () => {
    // The two formatters may only disagree downwards.
    for (const input of ['0.499999', '1.005', '0.015', '7.06', '0']) {
      const spendable = moneyFormatUsdSpendable(new BigNumber(input));
      const display = moneyFormatUsd(new BigNumber(input));

      expect(Number(spendable.replace(/[$,]/gu, ''))).toBeLessThanOrEqual(
        Number(display.replace(/[$,]/gu, '')),
      );
    }
  });
});
