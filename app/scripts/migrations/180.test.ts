import { NetworkState } from '@metamask/network-controller';
import { getBaseNetworkConfiguration, migrate, version } from './180';

const oldVersion = 179;

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

  it('logs an error and returns the original state if NetworkController is missing', async () => {
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

  it('does not modify state if Base network with Infura configuration is already present', async () => {
    const infuraBaseConfig = {
      chainId: '0x2105',
      name: 'Base',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'base-mainnet',
          type: 'infura',
          url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
          failoverUrls: [],
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [],
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': infuraBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network config is unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x2105'],
    ).toStrictEqual(infuraBaseConfig);

    // Assert - the entire state structure is unchanged
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds Infura endpoint to existing custom Base network', async () => {
    const customBaseConfig = {
      chainId: '0x2105',
      name: 'My Custom Base',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'custom-base',
          type: 'custom',
          url: 'https://custom-base-rpc.example.com',
          failoverUrls: [],
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://custom-explorer.example.com'],
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': customBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network now has both custom and Infura endpoints
    const updatedConfig = (newStorage.data.NetworkController as NetworkState)
      .networkConfigurationsByChainId['0x2105'];

    expect(updatedConfig.chainId).toBe('0x2105');
    expect(updatedConfig.name).toBe('My Custom Base');
    expect(updatedConfig.nativeCurrency).toBe('ETH');
    expect(updatedConfig.blockExplorerUrls).toEqual([
      'https://custom-explorer.example.com',
    ]);
    expect(updatedConfig.rpcEndpoints).toHaveLength(2);
    expect(updatedConfig.rpcEndpoints[0]).toEqual(
      customBaseConfig.rpcEndpoints[0],
    );
    expect(updatedConfig.rpcEndpoints[1]).toEqual(
      getBaseNetworkConfiguration().rpcEndpoints[0],
    );
  });

  it('adds Infura endpoint to Base network with non-Infura endpoints', async () => {
    const mixedBaseConfig = {
      chainId: '0x2105',
      name: 'Base',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          networkClientId: 'custom-base',
          type: 'custom',
          url: 'https://custom-base-rpc.example.com',
          failoverUrls: [],
        },
        {
          networkClientId: 'base-mainnet',
          type: 'custom', // Wrong type - should be 'infura'
          url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
          failoverUrls: [],
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [],
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': mixedBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network now has all existing endpoints plus Infura endpoint
    const updatedConfig = (newStorage.data.NetworkController as NetworkState)
      .networkConfigurationsByChainId['0x2105'];

    expect(updatedConfig.chainId).toBe('0x2105');
    expect(updatedConfig.name).toBe('Base');
    expect(updatedConfig.nativeCurrency).toBe('ETH');
    expect(updatedConfig.rpcEndpoints).toHaveLength(3);
    expect(updatedConfig.rpcEndpoints[0]).toEqual(
      mixedBaseConfig.rpcEndpoints[0],
    );
    expect(updatedConfig.rpcEndpoints[1]).toEqual(
      mixedBaseConfig.rpcEndpoints[1],
    );
    expect(updatedConfig.rpcEndpoints[2]).toEqual(
      getBaseNetworkConfiguration().rpcEndpoints[0],
    );
  });

  it('adds Base network to networkConfigurationsByChainId if not already present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            // Some network configurations, but not Base
            '0x1': { chainId: '0x1' },
            '0x1337': { chainId: '0x1337' },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network was added
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x2105'],
    ).toStrictEqual(getBaseNetworkConfiguration());

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

  it('handles Base network with malformed rpcEndpoints gracefully', async () => {
    const malformedBaseConfig = {
      chainId: '0x2105',
      name: 'Base',
      nativeCurrency: 'ETH',
      rpcEndpoints: 'not an array', // Malformed
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [],
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': malformedBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network now has Infura endpoint added (malformed endpoints ignored)
    const updatedConfig = (newStorage.data.NetworkController as NetworkState)
      .networkConfigurationsByChainId['0x2105'];

    expect(updatedConfig.chainId).toBe('0x2105');
    expect(updatedConfig.name).toBe('Base');
    expect(updatedConfig.nativeCurrency).toBe('ETH');
    expect(updatedConfig.rpcEndpoints).toHaveLength(1);
    expect(updatedConfig.rpcEndpoints[0]).toEqual(
      getBaseNetworkConfiguration().rpcEndpoints[0],
    );
  });

  it('handles Base network with empty rpcEndpoints array', async () => {
    const emptyEndpointsBaseConfig = {
      chainId: '0x2105',
      name: 'Base',
      nativeCurrency: 'ETH',
      rpcEndpoints: [],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [],
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': emptyEndpointsBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network now has Infura endpoint added to empty array
    const updatedConfig = (newStorage.data.NetworkController as NetworkState)
      .networkConfigurationsByChainId['0x2105'];

    expect(updatedConfig.chainId).toBe('0x2105');
    expect(updatedConfig.name).toBe('Base');
    expect(updatedConfig.nativeCurrency).toBe('ETH');
    expect(updatedConfig.rpcEndpoints).toHaveLength(1);
    expect(updatedConfig.rpcEndpoints[0]).toEqual(
      getBaseNetworkConfiguration().rpcEndpoints[0],
    );
  });

  describe('getBaseNetworkConfiguration', () => {
    it('returns the correct Base network configuration', () => {
      const config = getBaseNetworkConfiguration();

      expect(config).toStrictEqual({
        blockExplorerUrls: [],
        chainId: '0x2105',
        defaultRpcEndpointIndex: 0,
        name: 'Base',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            failoverUrls: [],
            networkClientId: 'base-mainnet',
            type: 'infura',
            url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      });
    });
  });
});
