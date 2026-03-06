import { toPlainString } from './string';

describe('string utils', () => {
  describe('toPlainString', () => {
    it('returns the original string when value is a non-empty string', () => {
      expect(toPlainString('Verified site')).toBe('Verified site');
    });

    it('returns undefined for non-string values', () => {
      expect(toPlainString(123)).toBeUndefined();
      expect(toPlainString({})).toBeUndefined();
    });

    it('returns undefined for strings that contain only whitespace', () => {
      expect(toPlainString('   ')).toBeUndefined();
      expect(toPlainString('\n\t')).toBeUndefined();
    });
  });
});
