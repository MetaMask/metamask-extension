import { NetworkState } from '@metamask/network-controller';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import { migrate, version } from './182';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

const oldVersion = 181;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
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

  it('does not modify state if FEATURED_RPCS networks are already present', async () => {
    // Create a state with all FEATURED_RPCS networks already present
    const existingNetworks: Record<string, unknown> = {};
    FEATURED_RPCS.forEach((network) => {
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
        defaultBlockExplorerUrlIndex: network.defaultBlockExplorerUrlIndex || 0,
      };
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

    // Assert - All networks remain unchanged
    FEATURED_RPCS.forEach((network) => {
      expect(
        (newStorage.data.NetworkController as NetworkState)
          .networkConfigurationsByChainId[network.chainId],
      ).toStrictEqual(existingNetworks[network.chainId]);
    });

    // Assert - the entire state structure is unchanged
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds all FEATURED_RPCS networks to networkConfigurationsByChainId if not already present', async () => {
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

    // Assert - All FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
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

  it('adds only missing FEATURED_RPCS networks when some are already present', async () => {
    // Create a state with only some FEATURED_RPCS networks present
    const existingNetworks: Record<string, unknown> = {
      '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      // Add only the first FEATURED_RPCS network
      [FEATURED_RPCS[0].chainId]: {
        chainId: FEATURED_RPCS[0].chainId,
        name: FEATURED_RPCS[0].name,
        nativeCurrency: FEATURED_RPCS[0].nativeCurrency,
        rpcEndpoints: FEATURED_RPCS[0].rpcEndpoints.map((endpoint) => ({
          url: endpoint.url,
          failoverUrls: endpoint.failoverUrls || [],
          type: endpoint.type,
          networkClientId: 'existing-client-id',
        })),
        defaultRpcEndpointIndex: FEATURED_RPCS[0].defaultRpcEndpointIndex,
        blockExplorerUrls: FEATURED_RPCS[0].blockExplorerUrls || [],
        defaultBlockExplorerUrlIndex:
          FEATURED_RPCS[0].defaultBlockExplorerUrlIndex || 0,
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

    // Assert - The first network remains unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[FEATURED_RPCS[0].chainId],
    ).toStrictEqual(existingNetworks[FEATURED_RPCS[0].chainId]);

    // Assert - All other FEATURED_RPCS networks were added
    FEATURED_RPCS.slice(1).forEach((network) => {
      const addedNetwork = (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[network.chainId];

      expect(addedNetwork).toBeDefined();
      expect(addedNetwork.chainId).toBe(network.chainId);
      expect(addedNetwork.name).toBe(network.name);
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

    // Assert - All FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      const addedNetwork = (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[network.chainId];

      expect(addedNetwork).toBeDefined();
      expect(addedNetwork.chainId).toBe(network.chainId);
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

    // Assert - All FEATURED_RPCS networks were added
    FEATURED_RPCS.forEach((network) => {
      const addedNetwork = (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[network.chainId];

      expect(addedNetwork).toBeDefined();
      expect(addedNetwork.chainId).toBe(network.chainId);
    });
  });
});
