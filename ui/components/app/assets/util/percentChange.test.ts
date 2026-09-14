import { computePercentChange } from './percentChange';

describe('computePercentChange', () => {
  describe('valid calculations', () => {
    it.each([
      // [currentValue, previousValue, expected, description]
      [110, 100, 10, 'positive change: +10%'],
      [150, 100, 50, 'positive change: +50%'],
      [200, 100, 100, 'positive change: +100%'],
      [90, 100, -10, 'negative change: -10%'],
      [50, 100, -50, 'negative change: -50%'],
      [0, 100, -100, 'negative change: -100%'],
      [100, 100, 0, 'no change: same integer value'],
      [42.5, 42.5, 0, 'no change: same fractional value'],
      [105.5, 100, 5.5, 'fractional result: +5.5%'],
      [97.25, 100, -2.75, 'fractional result: -2.75%'],
      [10000, 100, 9900, 'large positive change: +9900%'],
      [1, 10000, -99.99, 'large negative change: -99.99%'],
    ])(
      'computes %s → %s as %s% (%s)',
      (currentValue, previousValue, expected) => {
        expect(computePercentChange(currentValue, previousValue)).toBe(
          expected,
        );
      },
    );
  });

  describe('edge cases returning undefined', () => {
    it.each([
      // [currentValue, previousValue, description]
      [undefined, 100, 'current value is undefined'],
      [110, undefined, 'previous value is undefined'],
      [undefined, undefined, 'both values are undefined'],
      [100, 0, 'previous value is zero (division by zero)'],
      [0, 0, 'both values are zero (division by zero)'],
    ])(
      'returns undefined when %s',
      (currentValue, previousValue, _description) => {
        expect(
          computePercentChange(currentValue, previousValue),
        ).toBeUndefined();
      },
    );
  });

  describe('precision', () => {
    it('handles very small changes accurately', () => {
      const result = computePercentChange(100.01, 100);
      expect(result).toBeCloseTo(0.01, 10);
    });
  });
});
