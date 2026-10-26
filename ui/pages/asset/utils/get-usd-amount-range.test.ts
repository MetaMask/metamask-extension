import { getUsdAmountRange } from './get-usd-amount-range';

describe('getUsdAmountRange', () => {
  it('maps numeric amounts to the mobile analytics ranges', () => {
    expect(getUsdAmountRange(undefined)).toBe('< 0.01');
    expect(getUsdAmountRange(0)).toBe('< 0.01');
    expect(getUsdAmountRange(0.005)).toBe('< 0.01');
    expect(getUsdAmountRange(0.01)).toBe('0.01 - 0.99');
    expect(getUsdAmountRange(0.99)).toBe('0.01 - 0.99');
    expect(getUsdAmountRange(1)).toBe('1.00 - 9.99');
    expect(getUsdAmountRange(9.99)).toBe('1.00 - 9.99');
    expect(getUsdAmountRange(10)).toBe('10.00 - 99.99');
    expect(getUsdAmountRange(99.99)).toBe('10.00 - 99.99');
    expect(getUsdAmountRange(100)).toBe('100.00 - 999.99');
    expect(getUsdAmountRange(999.99)).toBe('100.00 - 999.99');
    expect(getUsdAmountRange(1000)).toBe('1000.00+');
  });

  it('maps formatted display amounts to the mobile analytics ranges', () => {
    expect(getUsdAmountRange('< 0.01')).toBe('< 0.01');
    expect(getUsdAmountRange('250.00')).toBe('100.00 - 999.99');
    expect(getUsdAmountRange('1234.50')).toBe('1000.00+');
    expect(getUsdAmountRange('invalid')).toBe('< 0.01');
  });
});
