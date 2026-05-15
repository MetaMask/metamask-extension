import {
  formatLiquidationDistancePercent,
  getLiquidationDistancePercent,
} from './formatPerpsDisplayPrice';

describe('getLiquidationDistancePercent', () => {
  it('returns absolute percent when current > liq', () => {
    expect(getLiquidationDistancePercent(2000, '1500')).toBeCloseTo(25);
  });

  it('returns 0 when liq equals current price', () => {
    expect(getLiquidationDistancePercent(2000, '2000')).toBe(0);
  });

  it('returns absolute percent when current < liq (crossed edge stays positive)', () => {
    expect(getLiquidationDistancePercent(1000, '1500')).toBeCloseTo(50);
  });

  it('parses currency-formatted liquidation strings', () => {
    expect(getLiquidationDistancePercent(2000, '$1,500.00')).toBeCloseTo(25);
  });

  describe('invalid inputs', () => {
    type InvalidCase = {
      label: string;
      current: number | null | undefined;
      liq: string | number | null | undefined;
    };
    const cases: InvalidCase[] = [
      { label: 'null current', current: null, liq: '1500' },
      { label: 'undefined current', current: undefined, liq: '1500' },
      { label: 'NaN current', current: Number.NaN, liq: '1500' },
      { label: 'zero current', current: 0, liq: '1500' },
      { label: 'negative current', current: -1, liq: '1500' },
      { label: 'null liq', current: 2000, liq: null },
      { label: 'undefined liq', current: 2000, liq: undefined },
      { label: 'zero liq', current: 2000, liq: '0' },
      { label: 'negative liq', current: 2000, liq: '-100' },
      { label: 'non-numeric liq', current: 2000, liq: 'abc' },
    ];
    cases.forEach(({ label, current, liq }) => {
      it(`returns null for ${label}`, () => {
        expect(getLiquidationDistancePercent(current, liq)).toBeNull();
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
});
