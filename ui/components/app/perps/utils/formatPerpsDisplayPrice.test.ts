import {
  formatLiquidationDistancePercent,
  getLiquidationDistancePercent,
} from './formatPerpsDisplayPrice';

describe('getLiquidationDistancePercent', () => {
  describe('long position', () => {
    it('returns positive percent when current > liq', () => {
      expect(getLiquidationDistancePercent(2000, '1500', 'long')).toBeCloseTo(
        25,
      );
    });

    it('returns 0 when liq equals current price', () => {
      expect(getLiquidationDistancePercent(2000, '2000', 'long')).toBe(0);
    });

    it('returns negative percent when current < liq (already-liquidated edge)', () => {
      expect(getLiquidationDistancePercent(1000, '1500', 'long')).toBeCloseTo(
        -50,
      );
    });

    it('parses currency-formatted liquidation strings', () => {
      expect(
        getLiquidationDistancePercent(2000, '$1,500.00', 'long'),
      ).toBeCloseTo(25);
    });
  });

  describe('short position', () => {
    it('returns positive percent when current < liq', () => {
      expect(getLiquidationDistancePercent(1000, '1500', 'short')).toBeCloseTo(
        50,
      );
    });

    it('returns negative percent when current > liq (already-liquidated edge)', () => {
      expect(getLiquidationDistancePercent(2000, '1500', 'short')).toBeCloseTo(
        -25,
      );
    });
  });

  describe('invalid inputs', () => {
    it.each([
      ['null current', null, '1500', 'long' as const],
      ['undefined current', undefined, '1500', 'long' as const],
      ['NaN current', Number.NaN, '1500', 'long' as const],
      ['zero current', 0, '1500', 'long' as const],
      ['negative current', -1, '1500', 'long' as const],
      ['null liq', 2000, null, 'long' as const],
      ['undefined liq', 2000, undefined, 'long' as const],
      ['zero liq', 2000, '0', 'long' as const],
      ['negative liq', 2000, '-100', 'long' as const],
      ['non-numeric liq', 2000, 'abc', 'long' as const],
    ])('returns null for %s', (_label, current, liq, side) => {
      expect(getLiquidationDistancePercent(current, liq, side)).toBeNull();
    });
  });
});

describe('formatLiquidationDistancePercent', () => {
  it('rounds to nearest integer and appends %', () => {
    expect(formatLiquidationDistancePercent(33.6)).toBe('34%');
  });

  it('formats integer cleanly', () => {
    expect(formatLiquidationDistancePercent(25)).toBe('25%');
  });

  it('rounds 0.4 down', () => {
    expect(formatLiquidationDistancePercent(0.4)).toBe('0%');
  });

  it('formats negative percent', () => {
    expect(formatLiquidationDistancePercent(-5.2)).toBe('-5%');
  });
});
