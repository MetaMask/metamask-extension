import { migrate, version, CHAINS_TO_RENAME } from './178';

const oldVersion = 177;

type NetworkConfig = Record<string, { chainId: string; name: string }>;
// Create network configurations based on CHAINS_TO_RENAME data
const createNetworkConfigs = () => {
  const configs: NetworkConfig = {};

  // Add configurations for chains that will be renamed
  CHAINS_TO_RENAME.forEach((chain) => {
    configs[chain.id] = {
      chainId: chain.id,
      name: chain.fromName,
    };
  });

  return configs;
};

const networkConfigs = createNetworkConfigs();

// Helper to create test state
const createTestState = (networkConfigurationsByChainId: NetworkConfig) => ({
  meta: { version: oldVersion },
  data: {
    NetworkController: {
      selectedNetworkClientId: 'mainnet',
      networksMetadata: {},
      networkConfigurationsByChainId,
    },
  },
});

// Network name mappings for migration testing (derived from CHAINS_TO_RENAME)
const nameUpdates: Record<string, string> = Object.fromEntries(
  CHAINS_TO_RENAME.map((chain) => [chain.id, chain.toName]),
);

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = { meta: { version: oldVersion }, data: {} };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('NetworkController state transformations', () => {
    it('does nothing if `NetworkController` is missing', async () => {
      const oldStorage = { meta: { version: oldVersion }, data: {} };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({});
    });

    it('does nothing if `NetworkController` is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: { NetworkController: 'invalidData' },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing if `NetworkController.networkConfigurationsByChainId` is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: { networkConfigurationsByChainId: 'invalidData' },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing if there are custom names', async () => {
      // Create network configs with custom names (should not be migrated)
      const customNetworkConfigs = { ...networkConfigs };

      // Add "Custom" suffix to all chain names to make them non-matching
      Object.keys(customNetworkConfigs).forEach((chainId) => {
        if (customNetworkConfigs[chainId]) {
          customNetworkConfigs[chainId] = {
            ...customNetworkConfigs[chainId],
            name: `${customNetworkConfigs[chainId].name} Custom`,
          };
        }
      });

      const oldState = createTestState(customNetworkConfigs);
      const newStorage = await migrate(oldState);
      expect(newStorage.data).toStrictEqual(oldState.data);
    });

    it('updates the old names to new ones', async () => {
      const oldState = createTestState(networkConfigs);
      const newStorage = await migrate(oldState);

      // Create expected data by applying name updates
      const expectedNetworkConfigs = { ...networkConfigs };
      Object.entries(nameUpdates).forEach(([chainId, newName]) => {
        const config =
          expectedNetworkConfigs[
            chainId as keyof typeof expectedNetworkConfigs
          ];
        if (config) {
          expectedNetworkConfigs[
            chainId as keyof typeof expectedNetworkConfigs
          ] = {
            ...config,
            name: newName,
          };
        }
      });

      const expectedData = {
        NetworkController: {
          ...oldState.data.NetworkController,
          networkConfigurationsByChainId: expectedNetworkConfigs,
        },
      };

      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
