import {
  ENABLE_DMK_FEATURE_FLAG,
  isDmkFeatureEnabled,
} from './feature-flags';

describe('hardware-wallets/feature-flags', () => {
  describe('ENABLE_DMK_FEATURE_FLAG', () => {
    it('is the ledgerDmk remote flag key', () => {
      expect(ENABLE_DMK_FEATURE_FLAG).toBe('ledgerDmk');
    });
  });

  describe('isDmkFeatureEnabled', () => {
    it('returns false when remoteFeatureFlags is missing', () => {
      expect(isDmkFeatureEnabled(undefined)).toBe(false);
      expect(isDmkFeatureEnabled(null)).toBe(false);
    });

    it('returns false when ledgerDmk is absent', () => {
      expect(isDmkFeatureEnabled({})).toBe(false);
    });

    it('returns false for the production disabled variant', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: {
            enabled: false,
            featureVersion: null,
            minimumVersion: null,
          },
        }),
      ).toBe(false);
    });

    it('returns true when ledgerDmk is enabled and version requirements are met', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: {
            enabled: true,
            featureVersion: '13.0.0',
            minimumVersion: '13.0.0',
          },
        }),
      ).toBe(true);
    });

    it('returns false when ledgerDmk is enabled but minimumVersion is unmet', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: {
            enabled: true,
            featureVersion: '100.0.0',
            minimumVersion: '100.0.0',
          },
        }),
      ).toBe(false);
    });

    it('returns false when enabled is true without a string minimumVersion', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: {
            enabled: true,
          },
        }),
      ).toBe(false);
    });

    it('returns true for a plain boolean true flag', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: true,
        }),
      ).toBe(true);
    });

    it('returns false for a plain boolean false flag', () => {
      expect(
        isDmkFeatureEnabled({
          [ENABLE_DMK_FEATURE_FLAG]: false,
        }),
      ).toBe(false);
    });
  });
});
