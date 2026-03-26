import {
  getLimitOrderReferencePrice,
  isLimitPriceRestingOnBook,
} from './limitPriceRestingValidation';

describe('getLimitOrderReferencePrice', () => {
  it('uses mid price when positive and finite', () => {
    expect(getLimitOrderReferencePrice(100.5, 99)).toBe(100.5);
  });

  it('falls back to current price when mid is undefined', () => {
    expect(getLimitOrderReferencePrice(undefined, 99)).toBe(99);
  });

  it('falls back to current price when mid is zero', () => {
    expect(getLimitOrderReferencePrice(0, 99)).toBe(99);
  });
});

describe('isLimitPriceRestingOnBook', () => {
  it('returns true for long when limit is below reference', () => {
    expect(isLimitPriceRestingOnBook('long', 99, 100)).toBe(true);
  });

  it('returns false for long when limit equals reference', () => {
    expect(isLimitPriceRestingOnBook('long', 100, 100)).toBe(false);
  });

  it('returns false for long when limit is above reference', () => {
    expect(isLimitPriceRestingOnBook('long', 101, 100)).toBe(false);
  });

  it('returns true for short when limit is above reference', () => {
    expect(isLimitPriceRestingOnBook('short', 101, 100)).toBe(true);
  });

  it('returns false for short when limit equals reference', () => {
    expect(isLimitPriceRestingOnBook('short', 100, 100)).toBe(false);
  });

  it('returns false for short when limit is below reference', () => {
    expect(isLimitPriceRestingOnBook('short', 99, 100)).toBe(false);
  });

  it('returns false when reference is not positive', () => {
    expect(isLimitPriceRestingOnBook('long', 50, 0)).toBe(false);
  });
});
