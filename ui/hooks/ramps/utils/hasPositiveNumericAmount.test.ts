import { hasPositiveNumericAmount } from './hasPositiveNumericAmount';

describe('hasPositiveNumericAmount', () => {
  it('returns true for positive finite amounts', () => {
    expect(hasPositiveNumericAmount(1)).toBe(true);
    expect(hasPositiveNumericAmount(0.013745)).toBe(true);
    expect(hasPositiveNumericAmount('1.5')).toBe(true);
    expect(hasPositiveNumericAmount('0.01')).toBe(true);
  });

  it('returns false for non-positive or non-finite amounts', () => {
    expect(hasPositiveNumericAmount(null)).toBe(false);
    expect(hasPositiveNumericAmount(undefined)).toBe(false);
    expect(hasPositiveNumericAmount('')).toBe(false);
    expect(hasPositiveNumericAmount(0)).toBe(false);
    expect(hasPositiveNumericAmount('0')).toBe(false);
    expect(hasPositiveNumericAmount(-1)).toBe(false);
    expect(hasPositiveNumericAmount('-0.5')).toBe(false);
    expect(hasPositiveNumericAmount(NaN)).toBe(false);
    expect(hasPositiveNumericAmount(Infinity)).toBe(false);
    expect(hasPositiveNumericAmount(-Infinity)).toBe(false);
  });
});
