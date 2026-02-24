import {
  FEATURE_FLAG_REGISTRY,
  FeatureFlagStatus,
  FeatureFlagType,
  getDeprecatedFlags,
  getProductionRemoteFlagApiResponse,
  getProductionRemoteFlagDefaults,
  getRegisteredFlagNames,
  getRegistryEntriesByStatus,
  getRegistryEntry,
} from './feature-flag-registry';

describe('Feature Flag Registry', () => {
  describe('FEATURE_FLAG_REGISTRY', () => {
    it('contains entries for all registered flags', () => {
      const entries = Object.values(FEATURE_FLAG_REGISTRY);
      expect(entries.length).toBeGreaterThan(0);
    });

    it('has consistent name property matching the key', () => {
      for (const [key, entry] of Object.entries(FEATURE_FLAG_REGISTRY)) {
        expect(entry.name).toBe(key);
      }
    });

    it('has valid type for every entry', () => {
      for (const entry of Object.values(FEATURE_FLAG_REGISTRY)) {
        expect([FeatureFlagType.Remote, FeatureFlagType.Build]).toContain(
          entry.type,
        );
      }
    });

    it('has valid status for every entry', () => {
      for (const entry of Object.values(FEATURE_FLAG_REGISTRY)) {
        expect([
          FeatureFlagStatus.Active,
          FeatureFlagStatus.Deprecated,
        ]).toContain(entry.status);
      }
    });

    it('has productionDefault defined for every entry', () => {
      for (const entry of Object.values(FEATURE_FLAG_REGISTRY)) {
        expect(entry.productionDefault).toBeDefined();
      }
    });
  });

  describe('getProductionRemoteFlagApiResponse', () => {
    it('returns an array of single-key objects', () => {
      const response = getProductionRemoteFlagApiResponse();
      expect(Array.isArray(response)).toBe(true);

      for (const item of response) {
        expect(typeof item).toBe('object');
        expect(item).not.toBeNull();
        expect(Object.keys(item as Record<string, unknown>).length).toBe(1);
      }
    });

    it('only includes remote flags that are in production', () => {
      const response = getProductionRemoteFlagApiResponse();
      const flagNames = response.map(
        (item) => Object.keys(item as Record<string, unknown>)[0],
      );

      for (const name of flagNames) {
        const entry = FEATURE_FLAG_REGISTRY[name];
        expect(entry.type).toBe(FeatureFlagType.Remote);
        expect(entry.inProd).toBe(true);
      }
    });

    it('includes known production flags', () => {
      const response = getProductionRemoteFlagApiResponse();
      const flagNames = response.map(
        (item) => Object.keys(item as Record<string, unknown>)[0],
      );

      expect(flagNames).toContain('addSolanaAccount');
      expect(flagNames).toContain('bridgeConfig');
      expect(flagNames).toContain('smartTransactionsNetworks');
    });
  });

  describe('getProductionRemoteFlagDefaults', () => {
    it('returns a flat key-value map', () => {
      const defaults = getProductionRemoteFlagDefaults();
      expect(typeof defaults).toBe('object');
      expect(defaults).not.toBeNull();
    });

    it('includes known flags with correct values', () => {
      const defaults = getProductionRemoteFlagDefaults();
      expect(defaults.addBitcoinAccount).toBe(false);
      expect(defaults.addSolanaAccount).toBe(true);
      expect(defaults.settingsRedesign).toBe(false);
    });

    it('only includes remote production flags', () => {
      const defaults = getProductionRemoteFlagDefaults();
      for (const name of Object.keys(defaults)) {
        const entry = FEATURE_FLAG_REGISTRY[name];
        expect(entry.type).toBe(FeatureFlagType.Remote);
        expect(entry.inProd).toBe(true);
      }
    });
  });

  describe('getRegistryEntry', () => {
    it('returns the entry for a known flag', () => {
      const entry = getRegistryEntry('addSolanaAccount');
      expect(entry).toBeDefined();
      expect(entry?.name).toBe('addSolanaAccount');
      expect(entry?.productionDefault).toBe(true);
    });

    it('returns undefined for an unknown flag', () => {
      expect(getRegistryEntry('nonExistentFlag')).toBeUndefined();
    });
  });

  describe('getRegisteredFlagNames', () => {
    it('returns an array of strings', () => {
      const names = getRegisteredFlagNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(typeof name).toBe('string');
      }
    });

    it('matches the keys of FEATURE_FLAG_REGISTRY', () => {
      const names = getRegisteredFlagNames();
      expect(names).toStrictEqual(Object.keys(FEATURE_FLAG_REGISTRY));
    });
  });

  describe('getRegistryEntriesByStatus', () => {
    it('returns active entries', () => {
      const active = getRegistryEntriesByStatus(FeatureFlagStatus.Active);
      expect(active.length).toBeGreaterThan(0);
      for (const entry of active) {
        expect(entry.status).toBe(FeatureFlagStatus.Active);
      }
    });

    it('returns empty array when no entries match', () => {
      const deprecated = getRegistryEntriesByStatus(
        FeatureFlagStatus.Deprecated,
      );
      expect(deprecated).toHaveLength(0);
    });
  });

  describe('getDeprecatedFlags', () => {
    it('returns an array', () => {
      const deprecated = getDeprecatedFlags();
      expect(Array.isArray(deprecated)).toBe(true);
      for (const entry of deprecated) {
        expect(entry.status).toBe(FeatureFlagStatus.Deprecated);
      }
    });
  });
});
