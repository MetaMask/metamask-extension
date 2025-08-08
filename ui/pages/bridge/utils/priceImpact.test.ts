import { formatPriceImpact } from './priceImpact';

describe('formatPriceImpact', () => {
  it('should return 0% for undefined', () => {
    expect(formatPriceImpact(undefined)).toBe('0%');
  });

  it('should return 0% for 0', () => {
    expect(formatPriceImpact(0)).toBe('0%');
    expect(formatPriceImpact('0')).toBe('0%');
  });

  it('should return <0.01% for very small positive values', () => {
    expect(formatPriceImpact(0.007998969070672714)).toBe('<0.01%');
    expect(formatPriceImpact(0.009)).toBe('<0.01%');
    expect(formatPriceImpact('0.0001')).toBe('<0.01%');
  });

  it('should return <-0.01% for very small negative values', () => {
    expect(formatPriceImpact(-0.007)).toBe('<-0.01%');
    expect(formatPriceImpact(-0.009)).toBe('<-0.01%');
    expect(formatPriceImpact('-0.0001')).toBe('<-0.01%');
  });

  it('should format with 2 decimal places for normal values', () => {
    expect(formatPriceImpact(0.01)).toBe('0.01%');
    expect(formatPriceImpact(0.1)).toBe('0.10%');
    expect(formatPriceImpact(1)).toBe('1.00%');
    expect(formatPriceImpact(1.5)).toBe('1.50%');
    expect(formatPriceImpact(3.1415)).toBe('3.14%');
    expect(formatPriceImpact(10.999)).toBe('11.00%');
  });

  it('should handle negative values correctly', () => {
    expect(formatPriceImpact(-0.1)).toBe('-0.10%');
    expect(formatPriceImpact(-1.5)).toBe('-1.50%');
    expect(formatPriceImpact(-10)).toBe('-10.00%');
  });

  it('should handle string inputs', () => {
    expect(formatPriceImpact('1.5')).toBe('1.50%');
    expect(formatPriceImpact('0.007')).toBe('<0.01%');
    expect(formatPriceImpact('-2.567')).toBe('-2.57%');
  });
});
