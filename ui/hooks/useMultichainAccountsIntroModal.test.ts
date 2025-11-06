import { lt as semverLt, coerce as semverCoerce } from 'semver';

// Test the core logic independently of React hooks
describe('BIP-44 Banner Logic', () => {
  const BIP44_ACCOUNTS_INTRODUCTION_VERSION = '13.5.0';

  // Helper function that mirrors the hook's core logic
  const shouldShowBip44Banner = (
    isUnlocked: boolean,
    isMultichainAccountsEnabled: boolean,
    hasShownModalBefore: boolean,
    lastUpdatedAt: number | null,
    lastUpdatedFromVersion: string | null,
    isMainRoute: boolean,
  ) => {
    const isUpgradeFromLowerThanBip44Version = Boolean(
      lastUpdatedFromVersion &&
        typeof lastUpdatedFromVersion === 'string' &&
        (() => {
          try {
            const coercedVersion = semverCoerce(lastUpdatedFromVersion);
            return coercedVersion && semverLt(coercedVersion, BIP44_ACCOUNTS_INTRODUCTION_VERSION);
          } catch {
            return false;
          }
        })(),
    );

    return (
      isUnlocked &&
      isMultichainAccountsEnabled &&
      !hasShownModalBefore &&
      lastUpdatedAt !== null && // null = fresh install, timestamp = upgrade
      isUpgradeFromLowerThanBip44Version &&
      isMainRoute
    );
  };

  describe('shows banner correctly', () => {
    const baseParams = {
      isUnlocked: true,
      isMultichainAccountsEnabled: true,
      hasShownModalBefore: false,
      lastUpdatedAt: Date.now(),
      isMainRoute: true,
    };

    it('shows banner for upgrade from 13.4.0', () => {
      const result = shouldShowBip44Banner(
        baseParams.isUnlocked,
        baseParams.isMultichainAccountsEnabled,
        baseParams.hasShownModalBefore,
        baseParams.lastUpdatedAt,
        '13.4.0',
        baseParams.isMainRoute,
      );
      expect(result).toBe(true);
    });

    it('shows banner for upgrade from 12.0.0', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '12.0.0',
        true,
      );
      expect(result).toBe(true);
    });

    it('shows banner for upgrade from 13.4.9 (just before threshold)', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.4.9',
        true,
      );
      expect(result).toBe(true);
    });
  });

  describe('does NOT show banner correctly', () => {
    it('does NOT show for upgrade from 13.5.0 (threshold version)', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.5.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show for upgrade from 13.7.0', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.7.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show for fresh install (no previous version)', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        null,
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show when wallet is locked', () => {
      const result = shouldShowBip44Banner(
        false,
        true,
        false,
        Date.now(),
        '13.4.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show when multichain accounts disabled', () => {
      const result = shouldShowBip44Banner(
        true,
        false,
        false,
        Date.now(),
        '13.4.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show when modal already shown', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        true,
        Date.now(),
        '13.4.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('does NOT show on non-main route', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.4.0',
        false,
      );
      expect(result).toBe(false);
    });

    it('does NOT show for fresh install (lastUpdatedAt is null)', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        null,
        '13.4.0',
        true,
      );
      expect(result).toBe(false);
    });

    it('handles invalid semver version like 13.9.0.150 (4-part version)', () => {
      // This tests the bug fix for extensions with non-standard version formats
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.9.0.150', // Invalid semver - 4 parts
        true,
      );
      // Should gracefully handle and return false (coerced to 13.9.0 which is >= 13.5.0)
      expect(result).toBe(false);
    });

    it('handles invalid semver for older version like 13.4.0.100', () => {
      const result = shouldShowBip44Banner(
        true,
        true,
        false,
        Date.now(),
        '13.4.0.100', // Invalid semver - 4 parts, but coerces to 13.4.0
        true,
      );
      // Should coerce to 13.4.0 and show banner
      expect(result).toBe(true);
    });
  });
});
