import { NetworkState } from '@metamask/network-controller';
import { FEATURED_RPCS, CHAIN_IDS } from '../../../shared/constants/network';
import { migrate, version } from './182';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

const oldVersion = 181;

// Define the networks that should be added by this migration
const networksToAdd: string[] = [
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.BSC,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.SEI,
];

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
    // Mock process.env to allow migration logic to run
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('logs a warning and returns the original state if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${version}: NetworkController not found.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: 'not an object',
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController is not an object: string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not an object',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: string.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not modify state if supported FEATURED_RPCS networks are already present', async () => {
    // Create a state with all supported FEATURED_RPCS networks already present
    const existingNetworks: Record<string, unknown> = {};
    FEATURED_RPCS.forEach((network) => {
      // Only add networks in our specified list
      if (networksToAdd.includes(network.chainId)) {
        existingNetworks[network.chainId] = {
          chainId: network.chainId,
          name: network.name,
          nativeCurrency: network.nativeCurrency,
          rpcEndpoints: network.rpcEndpoints.map((endpoint) => ({
            url: endpoint.url,
            failoverUrls: endpoint.failoverUrls || [],
            type: endpoint.type,
            networkClientId: 'existing-client-id',
          })),
          defaultRpcEndpointIndex: network.defaultRpcEndpointIndex,
          blockExplorerUrls: network.blockExplorerUrls || [],
          defaultBlockExplorerUrlIndex:
            network.defaultBlockExplorerUrlIndex || 0,
        };
      }
    });

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - All supported networks remain unchanged
    FEATURED_RPCS.forEach((network) => {
      if (networksToAdd.includes(network.chainId)) {
        expect(
          (newStorage.data.NetworkController as NetworkState)
            .networkConfigurationsByChainId[network.chainId],
        ).toStrictEqual(existingNetworks[network.chainId]);
      }
    });

    // Assert - the entire state structure is unchanged
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds all supported FEATURED_RPCS networks to networkConfigurationsByChainId if not already present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            // Some existing networks, but not FEATURED_RPCS
            '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
            '0x1337': { chainId: '0x1337', name: 'Localhost' },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - All supported FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      if (networksToAdd.includes(network.chainId)) {
        const addedNetwork = (newStorage.data.NetworkController as NetworkState)
          .networkConfigurationsByChainId[network.chainId];

        expect(addedNetwork).toBeDefined();
        expect(addedNetwork.chainId).toBe(network.chainId);
        expect(addedNetwork.name).toBe(network.name);
        expect(addedNetwork.nativeCurrency).toBe(network.nativeCurrency);
        expect(addedNetwork.defaultRpcEndpointIndex).toBe(
          network.defaultRpcEndpointIndex,
        );
        expect(addedNetwork.blockExplorerUrls).toEqual(
          network.blockExplorerUrls || [],
        );
        expect(addedNetwork.defaultBlockExplorerUrlIndex).toBe(
          network.defaultBlockExplorerUrlIndex || 0,
        );

        // Check RPC endpoints structure
        expect(addedNetwork.rpcEndpoints).toHaveLength(
          network.rpcEndpoints.length,
        );
        network.rpcEndpoints.forEach((endpoint, index) => {
          expect(addedNetwork.rpcEndpoints[index].url).toBe(endpoint.url);
          expect(addedNetwork.rpcEndpoints[index].failoverUrls).toEqual(
            endpoint.failoverUrls || [],
          );
          expect(addedNetwork.rpcEndpoints[index].type).toBe(endpoint.type);
          expect(addedNetwork.rpcEndpoints[index].networkClientId).toBe(
            'mocked-uuid-123',
          );
        });
      }
    });

    // Assert - Other networks are unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1'],
    ).toStrictEqual(
      oldStorage.data.NetworkController.networkConfigurationsByChainId['0x1'],
    );
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1337'],
    ).toStrictEqual(
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        '0x1337'
      ],
    );
  });

  it('adds only missing supported FEATURED_RPCS networks when some are already present', async () => {
    // Find the first supported FEATURED_RPCS network
    const firstSupportedNetwork = FEATURED_RPCS.find((network) =>
      networksToAdd.includes(network.chainId),
    );

    if (!firstSupportedNetwork) {
      // Skip this test if no supported networks are found
      return;
    }

    // Create a state with only some supported FEATURED_RPCS networks present
    const existingNetworks: Record<string, unknown> = {
      '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      // Add only the first supported FEATURED_RPCS network
      [firstSupportedNetwork.chainId]: {
        chainId: firstSupportedNetwork.chainId,
        name: firstSupportedNetwork.name,
        nativeCurrency: firstSupportedNetwork.nativeCurrency,
        rpcEndpoints: firstSupportedNetwork.rpcEndpoints.map((endpoint) => ({
          url: endpoint.url,
          failoverUrls: endpoint.failoverUrls || [],
          type: endpoint.type,
          networkClientId: 'existing-client-id',
        })),
        defaultRpcEndpointIndex: firstSupportedNetwork.defaultRpcEndpointIndex,
        blockExplorerUrls: firstSupportedNetwork.blockExplorerUrls || [],
        defaultBlockExplorerUrlIndex:
          firstSupportedNetwork.defaultBlockExplorerUrlIndex || 0,
      },
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - The first supported network remains unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[firstSupportedNetwork.chainId],
    ).toStrictEqual(existingNetworks[firstSupportedNetwork.chainId]);

    // Assert - All other supported FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      if (
        networksToAdd.includes(network.chainId) &&
        network.chainId !== firstSupportedNetwork.chainId
      ) {
        const addedNetwork = (newStorage.data.NetworkController as NetworkState)
          .networkConfigurationsByChainId[network.chainId];

        expect(addedNetwork).toBeDefined();
        expect(addedNetwork.chainId).toBe(network.chainId);
        expect(addedNetwork.name).toBe(network.name);
      }
    });

    // Assert - Other existing networks are unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1'],
    ).toStrictEqual(existingNetworks['0x1']);
  });

  it('handles empty networkConfigurationsByChainId correctly', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - All supported FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      if (networksToAdd.includes(network.chainId)) {
        const addedNetwork = (newStorage.data.NetworkController as NetworkState)
          .networkConfigurationsByChainId[network.chainId];

        expect(addedNetwork).toBeDefined();
        expect(addedNetwork.chainId).toBe(network.chainId);
      }
    });
  });

  it('preserves existing network configurations when adding FEATURED_RPCS', async () => {
    const customNetwork = {
      chainId: '0x1234',
      name: 'Custom Network',
      nativeCurrency: 'CUSTOM',
      rpcEndpoints: [
        {
          url: 'https://custom-rpc.example.com',
          failoverUrls: [],
          type: 'custom',
          networkClientId: 'custom-client-id',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://custom-explorer.example.com'],
      defaultBlockExplorerUrlIndex: 0,
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1234': customNetwork,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Custom network is preserved
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1234'],
    ).toStrictEqual(customNetwork);

    // Assert - All supported FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      if (networksToAdd.includes(network.chainId)) {
        const addedNetwork = (newStorage.data.NetworkController as NetworkState)
          .networkConfigurationsByChainId[network.chainId];

        expect(addedNetwork).toBeDefined();
        expect(addedNetwork.chainId).toBe(network.chainId);
      }
    });
  });

  it('filters out unsupported FEATURED_RPCS networks', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Only supported networks were added
    const supportedNetworks = FEATURED_RPCS.filter((network) =>
      networksToAdd.includes(network.chainId),
    );
    const unsupportedNetworks = FEATURED_RPCS.filter(
      (network) => !networksToAdd.includes(network.chainId),
    );

    // Check that supported networks were added
    supportedNetworks.forEach((network) => {
      const addedNetwork = (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[network.chainId];
      expect(addedNetwork).toBeDefined();
      expect(addedNetwork.chainId).toBe(network.chainId);
    });

    // Check that unsupported networks were NOT added
    unsupportedNetworks.forEach((network) => {
      const addedNetwork = (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[network.chainId];
      expect(addedNetwork).toBeUndefined();
    });
  });
});
