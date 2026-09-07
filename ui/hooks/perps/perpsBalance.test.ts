import {
  isFinitePerpsTotal,
  parsePerpsTotalBalance,
  UNKNOWN_BALANCE,
} from './perpsBalance';

describe('perpsBalance', () => {
  describe('parsePerpsTotalBalance', () => {
    it.each([
      ['1,234.56', 1234.56],
      ['$1,234.56', 1234.56],
      ['0', 0],
      ['-12.5', -12.5],
    ])('parses %s as %s', (value, expected) => {
      expect(parsePerpsTotalBalance(value)).toBe(expected);
    });

    it.each(['', '--', 'NaN', '.'])('returns null for %s', (value) => {
      expect(parsePerpsTotalBalance(value)).toBeNull();
    });
  });

  describe('isFinitePerpsTotal', () => {
    it('identifies normalized finite totals', () => {
      expect(isFinitePerpsTotal('$1,234.56')).toBe(true);
      expect(isFinitePerpsTotal('--')).toBe(false);
    });
  });

  it('provides an unresolved balance placeholder', () => {
    expect(UNKNOWN_BALANCE).toEqual({
      spendableBalance: '',
      withdrawableBalance: '',
      totalBalance: '',
    });
  });
});
