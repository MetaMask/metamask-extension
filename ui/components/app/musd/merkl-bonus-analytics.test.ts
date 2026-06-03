import { getBonusAmountRange } from './merkl-bonus-analytics';

describe('getBonusAmountRange', () => {
  it('returns "< 0.01" for strings starting with <', () => {
    expect(getBonusAmountRange('< 0.01')).toBe('< 0.01');
    expect(getBonusAmountRange('<0.005')).toBe('< 0.01');
  });

  it('returns "< 0.01" for non-numeric input', () => {
    expect(getBonusAmountRange('invalid')).toBe('< 0.01');
  });

  it('buckets fractional amounts below 1', () => {
    expect(getBonusAmountRange('0.50')).toBe('0.01 - 0.99');
    expect(getBonusAmountRange('0.01')).toBe('0.01 - 0.99');
  });

  it('buckets amounts in 1–10, 10–100, 100–1000, and 1000+', () => {
    expect(getBonusAmountRange('1.00')).toBe('1.00 - 9.99');
    expect(getBonusAmountRange('9.99')).toBe('1.00 - 9.99');
    expect(getBonusAmountRange('10.00')).toBe('10.00 - 99.99');
    expect(getBonusAmountRange('99.99')).toBe('10.00 - 99.99');
    expect(getBonusAmountRange('100.00')).toBe('100.00 - 999.99');
    expect(getBonusAmountRange('999.99')).toBe('100.00 - 999.99');
    expect(getBonusAmountRange('1000.00')).toBe('1000.00+');
    expect(getBonusAmountRange('5000')).toBe('1000.00+');
  });
});
