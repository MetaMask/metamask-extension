import { isDottedNumericVersionLowerThanBoth } from './version';

describe('version utils', () => {
  describe('isDottedNumericVersionLowerThanBoth', () => {
    it('returns true when base version is lower than both comparison versions', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.112',
          '13.20.0.113',
          '13.20.0.120',
        ),
      ).toBe(true);
    });

    it('supports three-part versions via implicit build zero', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0',
          '13.20.0.1',
          '13.20.0.2',
        ),
      ).toBe(true);
    });

    it('normalizes leading zeros while comparing', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '0013.020.000.0004',
          '0013.020.000.0005',
          '13.20.0.6',
        ),
      ).toBe(true);
    });

    it('returns false when base is not lower than first comparison version', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.112',
          '13.20.0.112',
          '13.20.0.120',
        ),
      ).toBe(false);
    });

    it('returns false when base is not lower than second comparison version', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.119',
          '13.20.0.120',
          '13.20.0.119',
        ),
      ).toBe(false);
    });

    it('returns false when the base format is invalid', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20',
          '13.20.0.112',
          '13.20.0.120',
        ),
      ).toBe(false);
    });

    it('returns false when the first comparison format is invalid', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.111',
          '13.20.0.1.1',
          '13.20.0.120',
        ),
      ).toBe(false);
    });

    it('returns false when the second comparison format is invalid', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.112',
          '13.20.0.113',
          '13.20.0-beta.1',
        ),
      ).toBe(false);
    });

    it('handles extremely large numeric parts without overflow', () => {
      expect(
        isDottedNumericVersionLowerThanBoth(
          '13.20.0.999999999999999999999',
          '13.20.0.123456789012345678901234567890',
          '13.20.0.123456789012345678901234567891',
        ),
      ).toBe(true);
    });
  });
});
