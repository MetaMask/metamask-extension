import { formatUnits } from './unit';

describe('formatUnits', () => {
  it('formats positive values', () => {
    expect(formatUnits(69n, 0)).toBe('69');
    expect(formatUnits(69n, 5)).toBe('0.00069');
    expect(formatUnits(690n, 1)).toBe('69');
    expect(formatUnits(1300000n, 5)).toBe('13');
    expect(formatUnits(4200000000000n, 10)).toBe('420');
    expect(formatUnits(20000000000n, 9)).toBe('20');
    expect(formatUnits(40000000000000000000n, 18)).toBe('40');
    expect(formatUnits(10000000000000n, 18)).toBe('0.00001');
    expect(formatUnits(12345n, 4)).toBe('1.2345');
    expect(formatUnits(6942069420123456789123450000n, 18)).toBe(
      '6942069420.12345678912345',
    );
  });

  it('formats negative values', () => {
    expect(formatUnits(-690n, 1)).toBe('-69');
    expect(formatUnits(-1300000n, 5)).toBe('-13');
    expect(formatUnits(-4200000000000n, 10)).toBe('-420');
    expect(formatUnits(-20000000000n, 9)).toBe('-20');
    expect(formatUnits(-40000000000000000000n, 18)).toBe('-40');
    expect(formatUnits(-12345n, 4)).toBe('-1.2345');
    expect(formatUnits(-6942069420123456789123450000n, 18)).toBe(
      '-6942069420.12345678912345',
    );
  });
});
