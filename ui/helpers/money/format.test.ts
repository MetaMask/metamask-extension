import BigNumber from 'bignumber.js';
import { DUST_THRESHOLD, moneyFormatUsd } from './format';

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
