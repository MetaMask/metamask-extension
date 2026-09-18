import type { Json } from '@metamask/utils';
import {
  ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
  getEnabledAdvancedPermissions,
} from '../../../shared/lib/gator-permissions/feature-flags';
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

    it('registers the enabled advanced permissions remote flag', () => {
      const originalGatorEnabledPermissionTypes =
        process.env.GATOR_ENABLED_PERMISSION_TYPES;
      process.env.GATOR_ENABLED_PERMISSION_TYPES =
        'native-token-stream,native-token-periodic,erc20-token-stream,erc20-token-periodic,token-approval-revocation';

      const entry =
        FEATURE_FLAG_REGISTRY[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG];
      try {
        if (!entry) {
          throw new Error(
            `${ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG} is not registered`,
          );
        }

        expect(entry).toStrictEqual({
          name: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
          type: FeatureFlagType.Remote,
          inProd: true,
          productionDefault: {
            permissions: [
              'native-token-stream',
              'native-token-periodic',
              'native-token-allowance',
              'erc20-token-stream',
              'erc20-token-periodic',
              'erc20-token-allowance',
              'token-approval-revocation',
            ],
          },
          status: FeatureFlagStatus.Active,
        });

        expect(
          getEnabledAdvancedPermissions({
            remoteFeatureFlags: {
              [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]:
                entry.productionDefault,
            },
          }),
        ).toStrictEqual([
          'native-token-stream',
          'native-token-periodic',
          'erc20-token-stream',
          'erc20-token-periodic',
          'token-approval-revocation',
        ]);
      } finally {
        if (originalGatorEnabledPermissionTypes === undefined) {
          delete process.env.GATOR_ENABLED_PERMISSION_TYPES;
        } else {
          process.env.GATOR_ENABLED_PERMISSION_TYPES =
            originalGatorEnabledPermissionTypes;
        }
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

    it('normalizes A/B threshold scopes to control at 1 and others at 0', () => {
      const response = getProductionRemoteFlagApiResponse();
      const bottomNav = response.find(
        (item) =>
          Object.keys(item as Record<string, unknown>)[0] ===
          'coreExtensionUxCeux1141AbtestBottomNav',
      ) as Record<string, Json> | undefined;

      expect(bottomNav?.coreExtensionUxCeux1141AbtestBottomNav).toStrictEqual([
        {
          name: 'control',
          scope: {
            type: 'threshold',
            value: 1,
          },
        },
        {
          name: 'treatment',
          scope: {
            type: 'threshold',
            value: 0,
          },
        },
      ]);
    });

    it('only uses 0 or 1 for threshold scope values', () => {
      const collectThresholdValues = (value: Json): number[] => {
        if (Array.isArray(value)) {
          const values: number[] = [];
          const isThresholdArray =
            value.length > 0 &&
            value.every(
              (item) =>
                item &&
                typeof item === 'object' &&
                !Array.isArray(item) &&
                (item as { scope?: { type?: string } }).scope?.type ===
                  'threshold',
            );
          if (isThresholdArray) {
            for (const item of value) {
              const scopeValue = (item as { scope?: { value?: number } }).scope
                ?.value;
              if (typeof scopeValue === 'number') {
                values.push(scopeValue);
              }
            }
            return values;
          }
          return value.flatMap((item) => collectThresholdValues(item as Json));
        }
        if (value && typeof value === 'object') {
          return Object.values(value).flatMap((nested) =>
            collectThresholdValues(nested),
          );
        }
        return [];
      };

      const response = getProductionRemoteFlagApiResponse();
      for (const item of response) {
        const flagValue = Object.values(item as Record<string, Json>)[0];
        for (const scopeValue of collectThresholdValues(flagValue)) {
          expect([0, 1]).toContain(scopeValue);
        }
      }
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

    it('returns deprecated entries', () => {
      const deprecated = getRegistryEntriesByStatus(
        FeatureFlagStatus.Deprecated,
      );
      for (const entry of deprecated) {
        expect(entry.status).toBe(FeatureFlagStatus.Deprecated);
      }
    });

    it('returns empty array when no entries match', () => {
      // Not a real status, so it can never match — asserting on a real status
      // would couple this case to whichever flags happen to be deprecated.
      const unmatched = getRegistryEntriesByStatus(
        'not-a-status' as FeatureFlagStatus,
      );
      expect(unmatched).toHaveLength(0);
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
