import { toFixedNoTrailingZeros } from './utils';

describe('toFixedNoTrailingZeros', () => {
  it('should remove trailing zeros for a value with no specified decimals (defaults to 7)', () => {
    expect(toFixedNoTrailingZeros(123.45)).toBe('123.45');
    expect(toFixedNoTrailingZeros(123.0001)).toBe('123.0001');
  });

  it('should remove trailing zeros for a value with specified decimals', () => {
    expect(toFixedNoTrailingZeros(123.456789, 5)).toBe('123.45679');
    expect(toFixedNoTrailingZeros(123.0001, 5)).toBe('123.0001');
    expect(toFixedNoTrailingZeros(123.4567, 6)).toBe('123.4567');
  });

  it('should handle whole numbers', () => {
    expect(toFixedNoTrailingZeros(123)).toBe('123');
    expect(toFixedNoTrailingZeros(123.0)).toBe('123');
    expect(toFixedNoTrailingZeros(0)).toBe('0');
    expect(toFixedNoTrailingZeros(0.00000001)).toBe('0');
  });

  it('should not remove non-trailing zeros', () => {
    expect(toFixedNoTrailingZeros(123.45001)).toBe('123.45001');
    expect(toFixedNoTrailingZeros(0.00001)).toBe('0.00001');
    expect(toFixedNoTrailingZeros(1.0001)).toBe('1.0001');
  });
});
