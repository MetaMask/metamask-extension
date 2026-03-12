import {
  isEqualCaseInsensitive,
  prependZero,
  toKebabCase,
} from './string-utils';

describe('string-utils', () => {
  describe('isEqualCaseInsensitive', () => {
    it('should return true for FOO and foo', () => {
      expect(isEqualCaseInsensitive('FOO', 'foo')).toBeTruthy();
    });

    it('should return false for foo and Bar', () => {
      expect(isEqualCaseInsensitive('foo', 'Bar')).toBeFalsy();
    });

    it('should return false for number and string comparision', () => {
      expect(isEqualCaseInsensitive('foo', 123)).toBeFalsy();
    });
  });

  describe('prependZero', () => {
    it('should return number to given max length string when digit is smaller than maxLength', () => {
      expect(prependZero(123, 4)).toStrictEqual('0123');
    });

    it('should return number to given max length string when digit is large than maxLength', () => {
      expect(prependZero(123, 2)).toStrictEqual('123');
    });
  });

  describe('toKebabCase', () => {
    it('converts camelCase to kebab-case', () => {
      expect(toKebabCase('startupStandardHome')).toBe('startup-standard-home');
    });

    it('converts PascalCase to kebab-case', () => {
      expect(toKebabCase('SwapPage')).toBe('swap-page');
    });

    it('converts single lowercase word unchanged', () => {
      expect(toKebabCase('startup')).toBe('startup');
    });

    it('handles consecutive uppercase letters', () => {
      expect(toKebabCase('getHTTPSUrl')).toBe('get-h-t-t-p-s-url');
    });

    it('handles single uppercase letter', () => {
      expect(toKebabCase('A')).toBe('a');
    });

    it('returns empty string for empty input', () => {
      expect(toKebabCase('')).toBe('');
    });

    it('handles already-kebab-case input', () => {
      expect(toKebabCase('already-kebab')).toBe('already-kebab');
    });
  });
});
