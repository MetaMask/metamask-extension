import { isGeoBlocked } from './validation';

describe('MUSD Validation Utilities', () => {
  describe('isGeoBlocked', () => {
    const blockedRegions = ['GB', 'GB-ENG', 'US-NY'];

    it('should return true for blocked country', () => {
      expect(isGeoBlocked('GB', blockedRegions)).toBe(true);
    });

    it('should return true for blocked region', () => {
      expect(isGeoBlocked('GB-ENG', blockedRegions)).toBe(true);
    });

    it('should return true for blocked US state', () => {
      expect(isGeoBlocked('US-NY', blockedRegions)).toBe(true);
    });

    it('should return false for non-blocked country', () => {
      expect(isGeoBlocked('US', blockedRegions)).toBe(false);
      expect(isGeoBlocked('DE', blockedRegions)).toBe(false);
    });

    it('should return false for non-blocked US state', () => {
      expect(isGeoBlocked('US-CA', blockedRegions)).toBe(false);
    });

    it('should use startsWith matching for country-region codes', () => {
      // GB should match GB-ENG, GB-SCT, etc.
      expect(isGeoBlocked('GB-SCT', ['GB'])).toBe(true);
      // But US should not match if only US-NY is blocked
      expect(isGeoBlocked('US', ['US-NY'])).toBe(false);
    });

    it('should return true (block by default) for unknown/empty country', () => {
      expect(isGeoBlocked('', blockedRegions)).toBe(true);
      expect(isGeoBlocked(undefined as unknown as string, blockedRegions)).toBe(
        true,
      );
    });
  });
});
