import {
  escapeHiddenUnicode,
  isEqualCaseInsensitive,
  prependZero,
} from './string-utils';

describe('string-utils', () => {
  describe('escapeHiddenUnicode', () => {
    it('should return the same string when there are no hidden Unicode characters', () => {
      expect(escapeHiddenUnicode('foo')).toBe('foo');
    });

    it('should escape hidden Unicode characters', () => {
      expect(escapeHiddenUnicode('hello󠁶‮world\u2028hi∞')).toBe(
        'hello󠁶U+202EworldU+2028hi∞',
      );
    });
  });

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
});
