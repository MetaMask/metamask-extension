import {
  isEqualCaseInsensitive,
  prependZero,
  toKebabCase,
  toCamelCase,
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
    it('converts camelCase and PascalCase to kebab-case', () => {
      expect(toKebabCase('startupStandardHome')).toBe('startup-standard-home');
      expect(toKebabCase('SwapPage')).toBe('swap-page');
      expect(toKebabCase('getHTTPSUrl')).toBe('get-h-t-t-p-s-url');
    });
  });

  describe('toCamelCase', () => {
    it('converts kebab-case to camelCase', () => {
      expect(toCamelCase('onboarding-import-wallet')).toBe(
        'onboardingImportWallet',
      );
      expect(toCamelCase('load-new-account')).toBe('loadNewAccount');
    });

    it('is the inverse of toKebabCase', () => {
      const original = 'myVariableName';
      expect(toCamelCase(toKebabCase(original))).toBe(original);
    });
  });
});
