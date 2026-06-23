import {
  getProductionRemoteFlagApiResponse,
  getProductionRemoteFlagDefaults,
} from './feature-flag-registry';
import {
  compareProductionFlagsToRegistry,
  insertRegistryEntryAlphabetically,
  normalizeRegistryOrdering,
  sortKeysDeep,
} from './sync-production-flags';

const MINIMAL_REGISTRY_CONTENT = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  alphaFlag: {
    name: 'alphaFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },

  zuluFlag: {
    name: 'zuluFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '1.0.0',
    },
    status: FeatureFlagStatus.Active,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================
`;

const SHUFFLED_REGISTRY_CONTENT = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  zuluFlag: {
    name: 'zuluFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: {
      enabled: true,
      minimumVersion: '1.0.0',
    },
    status: FeatureFlagStatus.Active,
  },

  alphaFlag: {
    name: 'alphaFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: true,
    status: FeatureFlagStatus.Active,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================
`;

describe('sortKeysDeep', () => {
  it('sorts object keys alphabetically at every nesting level', () => {
    const input = {
      zebra: 1,
      alpha: {
        zeta: 2,
        beta: 3,
      },
    };

    expect(sortKeysDeep(input)).toStrictEqual({
      alpha: {
        beta: 3,
        zeta: 2,
      },
      zebra: 1,
    });
  });

  it('preserves array element order', () => {
    const input = [{ value: false, name: 'sentinel off' }];

    expect(sortKeysDeep(input)).toStrictEqual([
      { name: 'sentinel off', value: false },
    ]);
  });

  it('produces identical output for key-order-only differences', () => {
    const first = sortKeysDeep({
      enabled: true,
      minimumVersion: '13.33.0',
      featureVersion: '1',
    });
    const second = sortKeysDeep({
      featureVersion: '1',
      minimumVersion: '13.33.0',
      enabled: true,
    });

    expect(first).toStrictEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});

describe('insertRegistryEntryAlphabetically', () => {
  it('inserts a new entry before later alphabetical entries', () => {
    const updated = insertRegistryEntryAlphabetically(
      MINIMAL_REGISTRY_CONTENT,
      'mikeFlag',
      { enabled: true },
    );

    const mikeIndex = updated.indexOf('mikeFlag:');
    const zuluIndex = updated.indexOf('zuluFlag:');
    expect(mikeIndex).toBeGreaterThan(-1);
    expect(mikeIndex).toBeLessThan(zuluIndex);
  });

  it('inserts a new entry after earlier alphabetical entries', () => {
    const updated = insertRegistryEntryAlphabetically(
      MINIMAL_REGISTRY_CONTENT,
      'betaFlag',
      false,
    );

    const alphaIndex = updated.indexOf('alphaFlag:');
    const betaIndex = updated.indexOf('betaFlag:');
    const zuluIndex = updated.indexOf('zuluFlag:');
    expect(betaIndex).toBeGreaterThan(alphaIndex);
    expect(betaIndex).toBeLessThan(zuluIndex);
  });
});

describe('normalizeRegistryOrdering', () => {
  it('sorts registry entries alphabetically by flag name', () => {
    const normalized = normalizeRegistryOrdering(SHUFFLED_REGISTRY_CONTENT);
    expect(normalized.indexOf('alphaFlag:')).toBeLessThan(
      normalized.indexOf('zuluFlag:'),
    );
  });
});

describe('compareProductionFlagsToRegistry', () => {
  it('detects new flags in production not in registry', () => {
    const registryMap = { addSolanaAccount: true };
    const prodResponse = [
      { addSolanaAccount: true },
      { brandNewFlag: { enabled: true } },
    ];
    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    expect(result.newInProduction).toContainEqual({
      name: 'brandNewFlag',
      value: { enabled: true },
    });
    expect(result.hasDrift).toBe(true);
  });

  it('detects value mismatches between registry and production', () => {
    const registryMap = { addSolanaAccount: true, addBitcoinAccount: false };
    const prodResponse = [
      { addSolanaAccount: false },
      { addBitcoinAccount: false },
    ];
    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    const addSolanaMismatch = result.valueMismatches.find(
      (m) => m.name === 'addSolanaAccount',
    );
    expect(addSolanaMismatch).toBeDefined();
    expect(addSolanaMismatch?.productionValue).toBe(false);
    expect(addSolanaMismatch?.registryValue).toBe(true);
    expect(result.hasDrift).toBe(true);
  });

  it('detects flags in registry no longer in production', () => {
    const registryMap = { someRemovedFlag: true };
    const prodResponse: Record<string, unknown>[] = [];
    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    expect(result.removedFromProduction).toContainEqual({
      name: 'someRemovedFlag',
      registryValue: true,
    });
    expect(result.hasDrift).toBe(true);
  });

  it('returns hasDrift false when production matches registry', () => {
    const registryMap = getProductionRemoteFlagDefaults() as Record<
      string,
      unknown
    >;
    const prodResponse = getProductionRemoteFlagApiResponse() as Record<
      string,
      unknown
    >[];

    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    expect(result.newInProduction).toHaveLength(0);
    expect(result.removedFromProduction).toHaveLength(0);
    expect(result.valueMismatches).toHaveLength(0);
    expect(result.inProdMismatches).toHaveLength(0);
    expect(result.hasDrift).toBe(false);
  });

  it('detects inProd mismatch when flag exists with inProd false but is in production', () => {
    const registryMap = {}; // Filtered registry excludes inProd: false
    const prodResponse = [{ staleInProdFlag: true }];
    const fullRegistryOverride = { staleInProdFlag: { inProd: false } };

    const result = compareProductionFlagsToRegistry(
      prodResponse,
      registryMap,
      fullRegistryOverride,
    );

    expect(result.inProdMismatches).toContainEqual({
      name: 'staleInProdFlag',
      productionValue: true,
    });
    expect(result.newInProduction).toHaveLength(0);
    expect(result.hasDrift).toBe(true);
  });

  it('skips excluded flags (e.g. extensionUpdatePromptMinimumVersion)', () => {
    const registryMap = { extensionUpdatePromptMinimumVersion: '1.0.0' };
    const prodResponse = [{ extensionUpdatePromptMinimumVersion: '13.21.0' }];
    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    expect(result.valueMismatches).toHaveLength(0);
    expect(result.newInProduction).toHaveLength(0);
    expect(result.removedFromProduction).toHaveLength(0);
    expect(result.inProdMismatches).toHaveLength(0);
    expect(result.hasDrift).toBe(false);
  });

  it('parses production API format (array of single-key objects)', () => {
    const registryMap = {};
    const prodResponse = [
      { flagA: true },
      { flagB: { nested: 'value' } },
      { flagC: [1, 2, 3] },
    ];
    const result = compareProductionFlagsToRegistry(prodResponse, registryMap);

    expect(result.newInProduction).toContainEqual({
      name: 'flagA',
      value: true,
    });
    expect(result.newInProduction).toContainEqual({
      name: 'flagB',
      value: { nested: 'value' },
    });
    expect(result.newInProduction).toContainEqual({
      name: 'flagC',
      value: [1, 2, 3],
    });
  });
});
