import { formatAmountInputFromNumber } from './perps-withdraw-amount-format';

describe('formatAmountInputFromNumber', () => {
  it('returns empty string for non-positive or non-finite values', () => {
    expect(formatAmountInputFromNumber(0)).toBe('');
    expect(formatAmountInputFromNumber(-1)).toBe('');
    expect(formatAmountInputFromNumber(Number.NaN)).toBe('');
  });

  it('formats values >= $0.01 with exactly 2 decimals (mobile parity)', () => {
    expect(formatAmountInputFromNumber(100)).toBe('100.00');
    expect(formatAmountInputFromNumber(0.5)).toBe('0.50');
    expect(formatAmountInputFromNumber(1124.532)).toBe('1124.53');
    expect(formatAmountInputFromNumber(11245.320509509998)).toBe('11245.32');
  });

  it('truncates (does not round) so output never exceeds input', () => {
    // `toFixed(2)` would round 100.007 → "100.01" and fail `amount <= balance`.
    expect(formatAmountInputFromNumber(100.007)).toBe('100.00');
    expect(formatAmountInputFromNumber(12.3456789)).toBe('12.34');
    expect(formatAmountInputFromNumber(0.999)).toBe('0.99');
  });

  it('formats values < $0.01 with 6 decimals, truncated', () => {
    expect(formatAmountInputFromNumber(0.001)).toBe('0.001000');
    expect(formatAmountInputFromNumber(0.0001234567)).toBe('0.000123');
    // Sub-cent path must also truncate.
    expect(formatAmountInputFromNumber(0.0099999999)).toBe('0.009999');
  });
});
