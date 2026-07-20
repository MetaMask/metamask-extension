import {
  FeatureFlagStatus,
  FeatureFlagType,
  getProductionRemoteFlagApiResponse,
  getProductionRemoteFlagDefaults,
} from './feature-flag-registry';
import type { FeatureFlagRegistryEntry } from './feature-flag-registry';
import {
  applySyncResultToRegistry,
  compareProductionFlagsToRegistry,
  ensureRegistryEslintWrappers,
  rebuildRegistryContent,
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

const SHUFFLED_REGISTRY_WITH_COMPUTED_KEY = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  zuluFlag: {
    name: 'zuluFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  [ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {
    name: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: { permissions: [] },
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

const REGISTRY_WITH_COMMENTS = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  zuluFlag: {
    name: 'zuluFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },

  // This comment explains the alpha flag.
  // See https://github.com/MetaMask/metamask-extension/pull/12345
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

describe('rebuildRegistryContent', () => {
  it('sorts registry entries alphabetically by flag name', () => {
    const registry = {
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
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(SHUFFLED_REGISTRY_CONTENT, registry);
    expect(rebuilt.indexOf('alphaFlag:')).toBeLessThan(
      rebuilt.indexOf('zuluFlag:'),
    );
  });

  it('sorts computed-key entries by their resolved flag name', () => {
    const registry = {
      alphaFlag: {
        name: 'alphaFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: true,
        status: FeatureFlagStatus.Active,
      },
      enabledAdvancedPermissions: {
        name: 'enabledAdvancedPermissions',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: { permissions: [] },
        status: FeatureFlagStatus.Active,
      },
      zuluFlag: {
        name: 'zuluFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(
      SHUFFLED_REGISTRY_WITH_COMPUTED_KEY,
      registry,
    );
    const alphaIndex = rebuilt.indexOf('alphaFlag:');
    const computedIndex = rebuilt.indexOf(
      '[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]',
    );
    const zuluIndex = rebuilt.indexOf('zuluFlag:');

    expect(alphaIndex).toBeGreaterThan(-1);
    expect(computedIndex).toBeGreaterThan(-1);
    expect(zuluIndex).toBeGreaterThan(-1);
    expect(alphaIndex).toBeLessThan(computedIndex);
    expect(computedIndex).toBeLessThan(zuluIndex);
  });

  it('renders computed-key syntax for mapped flags', () => {
    const registry = {
      enabledAdvancedPermissions: {
        name: 'enabledAdvancedPermissions',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: { permissions: [] },
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(MINIMAL_REGISTRY_CONTENT, registry);

    expect(rebuilt).toContain('[ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG]: {');
    expect(rebuilt).toContain('name: ENABLED_ADVANCED_PERMISSIONS_FEATURE_FLAG,');
    expect(rebuilt).not.toContain("name: 'enabledAdvancedPermissions',");
    expect(rebuilt).not.toContain('enabledAdvancedPermissions: {');
  });

  it('deep-sorts productionDefault keys for stable entries', () => {
    const registry = {
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
          minimumVersion: '1.0.0',
          enabled: true,
        },
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(SHUFFLED_REGISTRY_CONTENT, registry);
    const enabledIndex = rebuilt.indexOf('"enabled": true');
    const minimumVersionIndex = rebuilt.indexOf('"minimumVersion": "1.0.0"');

    expect(rebuilt.indexOf('alphaFlag:')).toBeLessThan(
      rebuilt.indexOf('zuluFlag:'),
    );
    expect(enabledIndex).toBeGreaterThan(-1);
    expect(minimumVersionIndex).toBeGreaterThan(-1);
    expect(enabledIndex).toBeLessThan(minimumVersionIndex);
  });

  it('preserves comments that precede entries', () => {
    const registry = {
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
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(REGISTRY_WITH_COMMENTS, registry);

    expect(rebuilt).toContain('// This comment explains the alpha flag.');
    expect(rebuilt).toContain(
      '// See https://github.com/MetaMask/metamask-extension/pull/12345',
    );

    const commentIndex = rebuilt.indexOf(
      '// This comment explains the alpha flag.',
    );
    const alphaIndex = rebuilt.indexOf('alphaFlag:');
    expect(commentIndex).toBeLessThan(alphaIndex);
  });

  it('preserves intra-entry comments', () => {
    const contentWithIntraComment = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  alphaFlag: {
    // Dark-launched: default OFF in production until rollout.
    name: 'alphaFlag',
    type: FeatureFlagType.Remote,
    inProd: true,
    productionDefault: false,
    status: FeatureFlagStatus.Active,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================
`;

    const registry = {
      alphaFlag: {
        name: 'alphaFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(contentWithIntraComment, registry);

    expect(rebuilt).toContain(
      '// Dark-launched: default OFF in production until rollout.',
    );
    const commentIdx = rebuilt.indexOf('// Dark-launched');
    const inProdIdx = rebuilt.indexOf('inProd:', commentIdx);
    expect(commentIdx).toBeLessThan(inProdIdx);
  });

  it('alphabetizes entry metadata fields', () => {
    const registry = {
      zuluFlag: {
        name: 'zuluFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: { enabled: true, minimumVersion: '1.0.0' },
        status: FeatureFlagStatus.Active,
      },
    };

    const rebuilt = rebuildRegistryContent(MINIMAL_REGISTRY_CONTENT, registry);
    const entryStart = rebuilt.indexOf('zuluFlag:');
    const inProdIndex = rebuilt.indexOf('inProd:', entryStart);
    const nameIndex = rebuilt.indexOf("name: 'zuluFlag'", entryStart);
    const productionDefaultIndex = rebuilt.indexOf(
      'productionDefault:',
      entryStart,
    );
    const statusIndex = rebuilt.indexOf('status:', entryStart);
    const typeIndex = rebuilt.indexOf('type:', entryStart);

    expect(inProdIndex).toBeLessThan(nameIndex);
    expect(nameIndex).toBeLessThan(productionDefaultIndex);
    expect(productionDefaultIndex).toBeLessThan(statusIndex);
    expect(statusIndex).toBeLessThan(typeIndex);
  });
});

describe('ensureRegistryEslintWrappers', () => {
  it('wraps the registry block with eslint disable and enable comments', () => {
    const content = `export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  alphaFlag: {
    inProd: true,
    name: 'alphaFlag',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================
`;

    const wrapped = ensureRegistryEslintWrappers(content);
    const disableIndex = wrapped.indexOf(
      '/* eslint-disable @typescript-eslint/naming-convention',
    );
    const exportIndex = wrapped.indexOf('export const FEATURE_FLAG_REGISTRY');
    const enableIndex = wrapped.indexOf(
      '/* eslint-enable @typescript-eslint/naming-convention */',
    );
    const helperIndex = wrapped.indexOf('// Helper Functions');

    expect(disableIndex).toBeGreaterThan(-1);
    expect(exportIndex).toBeGreaterThan(disableIndex);
    expect(enableIndex).toBeGreaterThan(exportIndex);
    expect(helperIndex).toBeGreaterThan(enableIndex);
  });

  it('deduplicates existing eslint wrappers before re-applying them', () => {
    const content = `/* eslint-disable @typescript-eslint/naming-convention -- production API flag names */
export const FEATURE_FLAG_REGISTRY: Record<string, FeatureFlagRegistryEntry> = {
  alphaFlag: {
    inProd: true,
    name: 'alphaFlag',
    productionDefault: true,
    status: FeatureFlagStatus.Active,
    type: FeatureFlagType.Remote,
  },
};
/* eslint-enable @typescript-eslint/naming-convention */

// ============================================================================
// Helper Functions
// ============================================================================
`;

    const wrapped = ensureRegistryEslintWrappers(content);
    const disableCount = (
      wrapped.match(
        /\/\* eslint-disable @typescript-eslint\/naming-convention/gu,
      ) ?? []
    ).length;
    const enableCount = (
      wrapped.match(
        /\/\* eslint-enable @typescript-eslint\/naming-convention \*\//gu,
      ) ?? []
    ).length;

    expect(disableCount).toBe(1);
    expect(enableCount).toBe(1);
  });
});

describe('applySyncResultToRegistry', () => {
  it('applies value mismatches, removals, and new flags', () => {
    const result = {
      newInProduction: [{ name: 'brandNewFlag', value: { enabled: true } }],
      removedFromProduction: [{ name: 'removedFlag', registryValue: false }],
      valueMismatches: [
        {
          name: 'changedFlag',
          productionValue: false,
          registryValue: true,
        },
      ],
      inProdMismatches: [
        {
          name: 'staleInProdFlag',
          productionValue: { enabled: true },
        },
      ],
      hasDrift: true,
    };

    const baseRegistry: Record<string, FeatureFlagRegistryEntry> = {
      changedFlag: {
        name: 'changedFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: true,
        status: FeatureFlagStatus.Active,
      },
      removedFlag: {
        name: 'removedFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
      staleInProdFlag: {
        name: 'staleInProdFlag',
        type: FeatureFlagType.Remote,
        inProd: false,
        productionDefault: false,
        status: FeatureFlagStatus.Active,
      },
    };

    const merged = applySyncResultToRegistry(result, baseRegistry);

    expect(merged.changedFlag.productionDefault).toBe(false);
    expect(merged.removedFlag).toBeUndefined();
    expect(merged.brandNewFlag).toStrictEqual({
      name: 'brandNewFlag',
      type: FeatureFlagType.Remote,
      inProd: true,
      productionDefault: { enabled: true },
      status: FeatureFlagStatus.Active,
    });
    expect(merged.staleInProdFlag).toStrictEqual({
      name: 'staleInProdFlag',
      type: FeatureFlagType.Remote,
      inProd: true,
      productionDefault: { enabled: true },
      status: FeatureFlagStatus.Active,
    });
  });

  it('does not mutate the base registry', () => {
    const baseRegistry: Record<string, FeatureFlagRegistryEntry> = {
      changedFlag: {
        name: 'changedFlag',
        type: FeatureFlagType.Remote,
        inProd: true,
        productionDefault: true,
        status: FeatureFlagStatus.Active,
      },
    };

    applySyncResultToRegistry(
      {
        newInProduction: [],
        removedFromProduction: [],
        valueMismatches: [
          {
            name: 'changedFlag',
            productionValue: false,
            registryValue: true,
          },
        ],
        inProdMismatches: [],
        hasDrift: true,
      },
      baseRegistry,
    );

    expect(baseRegistry.changedFlag.productionDefault).toBe(true);
    expect(baseRegistry.changedFlag.inProd).toBe(true);
  });

  it('ignores value mismatches for flags not present in the base registry', () => {
    const merged = applySyncResultToRegistry(
      {
        newInProduction: [],
        removedFromProduction: [],
        valueMismatches: [
          {
            name: 'unknownFlag',
            productionValue: false,
            registryValue: true,
          },
        ],
        inProdMismatches: [],
        hasDrift: true,
      },
      {},
    );

    expect(merged.unknownFlag).toBeUndefined();
  });
});

describe('updateRegistryFile integration', () => {
  it('merges drift and rebuilds sorted registry content', () => {
    const baseRegistry: Record<string, FeatureFlagRegistryEntry> = {
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
          minimumVersion: '1.0.0',
          enabled: true,
        },
        status: FeatureFlagStatus.Active,
      },
    };

    const merged = applySyncResultToRegistry(
      {
        newInProduction: [{ name: 'mikeFlag', value: { enabled: true } }],
        removedFromProduction: [],
        valueMismatches: [
          {
            name: 'zuluFlag',
            productionValue: { enabled: false, minimumVersion: '2.0.0' },
            registryValue: { enabled: true, minimumVersion: '1.0.0' },
          },
        ],
        inProdMismatches: [],
        hasDrift: true,
      },
      baseRegistry,
    );

    const rebuilt = rebuildRegistryContent(SHUFFLED_REGISTRY_CONTENT, merged);
    const wrapped = ensureRegistryEslintWrappers(rebuilt);

    const alphaIndex = wrapped.indexOf('alphaFlag:');
    const mikeIndex = wrapped.indexOf('mikeFlag:');
    const zuluIndex = wrapped.indexOf('zuluFlag:');
    const enabledIndex = wrapped.indexOf('"enabled": false');
    const minimumVersionIndex = wrapped.indexOf('"minimumVersion": "2.0.0"');

    expect(alphaIndex).toBeLessThan(mikeIndex);
    expect(mikeIndex).toBeLessThan(zuluIndex);
    expect(enabledIndex).toBeLessThan(minimumVersionIndex);
    expect(wrapped).toContain(
      '/* eslint-disable @typescript-eslint/naming-convention',
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
