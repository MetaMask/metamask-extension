import { formatPriceImpact } from './price-impact';

describe('formatPriceImpact', () => {
  it('should return 0% for undefined', () => {
    expect(formatPriceImpact(undefined)).toBe('0%');
  });

  it('should return 0% for 0', () => {
    expect(formatPriceImpact(0)).toBe('0%');
    expect(formatPriceImpact('0')).toBe('0%');
  });

  it('should return <0.01% for very small positive values', () => {
    expect(formatPriceImpact('0.00007998969070672714')).toBe('<0.01%');
    expect(formatPriceImpact('0.00009')).toBe('<0.01%');
    expect(formatPriceImpact('0.00009')).toBe('<0.01%');
  });

  it('should return <-0.01% for very small negative values', () => {
    expect(formatPriceImpact(-0.00007)).toBe('<-0.01%');
    expect(formatPriceImpact(-0.00009)).toBe('<-0.01%');
    expect(formatPriceImpact('-0.00009')).toBe('<-0.01%');
  });

  it('should format with expected precision for typical ranges', () => {
    // <1% → 2 decimals
    expect(formatPriceImpact(0.0001)).toBe('0.01%');
    expect(formatPriceImpact(0.001)).toBe('0.10%');
    // 1%–10% → 1 decimal
    expect(formatPriceImpact(0.01)).toBe('1.0%');
    expect(formatPriceImpact(0.015)).toBe('1.5%');
    expect(formatPriceImpact(0.031415)).toBe('3.1%');
    // ≥10% → no decimals
    expect(formatPriceImpact(0.10999)).toBe('11%');
  });

  it('should handle negative values correctly', () => {
    expect(formatPriceImpact(-0.001)).toBe('-0.10%');
    expect(formatPriceImpact(-0.015)).toBe('-1.5%');
    expect(formatPriceImpact(-0.1)).toBe('-10%');
  });

  it('should handle string inputs', () => {
    expect(formatPriceImpact('0.015')).toBe('1.5%');
    expect(formatPriceImpact('0.00007')).toBe('<0.01%');
    expect(formatPriceImpact('-0.02567')).toBe('-2.6%');
  });
});
