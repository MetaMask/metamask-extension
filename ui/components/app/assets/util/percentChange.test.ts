import { computePercentChange } from './percentChange';

describe('computePercentChange', () => {
  it('computes positive percentage change correctly', () => {
    expect(computePercentChange(110, 100)).toBe(10);
    expect(computePercentChange(150, 100)).toBe(50);
    expect(computePercentChange(200, 100)).toBe(100);
  });

  it('computes negative percentage change correctly', () => {
    expect(computePercentChange(90, 100)).toBe(-10);
    expect(computePercentChange(50, 100)).toBe(-50);
    expect(computePercentChange(0, 100)).toBe(-100);
  });

  it('handles no change', () => {
    expect(computePercentChange(100, 100)).toBe(0);
    expect(computePercentChange(42.5, 42.5)).toBe(0);
  });

  it('handles fractional values', () => {
    expect(computePercentChange(105.5, 100)).toBe(5.5);
    expect(computePercentChange(97.25, 100)).toBe(-2.75);
  });

  it('returns undefined when current value is undefined', () => {
    expect(computePercentChange(undefined, 100)).toBeUndefined();
  });

  it('returns undefined when previous value is undefined', () => {
    expect(computePercentChange(110, undefined)).toBeUndefined();
  });

  it('returns undefined when both values are undefined', () => {
    expect(computePercentChange(undefined, undefined)).toBeUndefined();
  });

  it('returns undefined when previous value is zero (division by zero)', () => {
    expect(computePercentChange(100, 0)).toBeUndefined();
    expect(computePercentChange(0, 0)).toBeUndefined();
  });

  it('handles very small changes accurately', () => {
    const result = computePercentChange(100.01, 100);
    expect(result).toBeCloseTo(0.01, 10);
  });

  it('handles very large percentage changes', () => {
    expect(computePercentChange(10000, 100)).toBe(9900);
    expect(computePercentChange(1, 10000)).toBe(-99.99);
  });
});
