import {
  isExtensionVersionNewer,
  isValidExtensionVersion,
} from './extension-version';

describe('extension-version', () => {
  describe('isValidExtensionVersion', () => {
    it('accepts three-segment and four-segment versions', () => {
      expect(isValidExtensionVersion('13.20.0')).toBe(true);
      expect(isValidExtensionVersion('10.2.3.112')).toBe(true);
      expect(isValidExtensionVersion('v1.2.3')).toBe(true);
    });

    it('rejects empty and unparseable values', () => {
      expect(isValidExtensionVersion('')).toBe(false);
      expect(isValidExtensionVersion('abc')).toBe(false);
      expect(isValidExtensionVersion(undefined)).toBe(false);
    });
  });

  describe('isExtensionVersionNewer', () => {
    it('compares three-segment versions', () => {
      expect(isExtensionVersionNewer('13.21.0', '13.20.0')).toBe(true);
      expect(isExtensionVersionNewer('13.20.0', '13.20.0')).toBe(false);
      expect(isExtensionVersionNewer('13.19.0', '13.20.0')).toBe(false);
    });

    it('compares four-segment versions and mixed lengths', () => {
      expect(isExtensionVersionNewer('10.2.3.112', '10.2.3.111')).toBe(true);
      expect(isExtensionVersionNewer('10.2.3.111', '10.2.3.112')).toBe(false);
      expect(isExtensionVersionNewer('10.2.3.1', '10.2.3')).toBe(true);
      expect(isExtensionVersionNewer('10.2.3', '10.2.3.1')).toBe(false);
    });

    it('returns false when either version is unparseable', () => {
      expect(isExtensionVersionNewer('abc', '1.0.0')).toBe(false);
      expect(isExtensionVersionNewer('1.0.0', undefined)).toBe(false);
    });
  });
});
