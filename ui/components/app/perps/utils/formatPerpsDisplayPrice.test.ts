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
    type InvalidCase = {
      label: string;
      current: number | null | undefined;
      liq: string | number | null | undefined;
      side: 'long' | 'short';
    };
    const cases: InvalidCase[] = [
      { label: 'null current', current: null, liq: '1500', side: 'long' },
      {
        label: 'undefined current',
        current: undefined,
        liq: '1500',
        side: 'long',
      },
      { label: 'NaN current', current: Number.NaN, liq: '1500', side: 'long' },
      { label: 'zero current', current: 0, liq: '1500', side: 'long' },
      { label: 'negative current', current: -1, liq: '1500', side: 'long' },
      { label: 'null liq', current: 2000, liq: null, side: 'long' },
      { label: 'undefined liq', current: 2000, liq: undefined, side: 'long' },
      { label: 'zero liq', current: 2000, liq: '0', side: 'long' },
      { label: 'negative liq', current: 2000, liq: '-100', side: 'long' },
      { label: 'non-numeric liq', current: 2000, liq: 'abc', side: 'long' },
    ];
    cases.forEach(({ label, current, liq, side }) => {
      it(`returns null for ${label}`, () => {
        expect(getLiquidationDistancePercent(current, liq, side)).toBeNull();
      });
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
