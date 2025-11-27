import { migrate, version } from './184';

const oldVersion = 183;
const OLD_CHAIN_ID = '0x18c6';
const NEW_CHAIN_ID = '0x18c7';
const OLD_RPC_URL = 'https://carrot.megaeth.com/rpc';
const NEW_RPC_URL = 'https://timothy.megaeth.com/rpc';

/**
 * Get the old MegaETH testnet network configuration object.
 *
 * @returns The old MegaETH testnet network configuration object.
 */
const getOldMegaEthTestnetConfiguration = () => ({
  chainId: OLD_CHAIN_ID,
  name: 'Mega Testnet',
  nativeCurrency: 'MegaETH',
  blockExplorerUrls: ['https://megaexplorer.xyz'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: 'megaeth-testnet',
      url: OLD_RPC_URL,
      type: 'custom',
    },
  ],
});

/**
 * Get the new MegaETH testnet network configuration object after migration.
 *
 * @returns The new MegaETH testnet network configuration object.
 */
const getNewMegaEthTestnetConfiguration = () => ({
  chainId: NEW_CHAIN_ID,
  name: 'Mega Testnet',
  nativeCurrency: 'MegaETH',
  blockExplorerUrls: ['https://megaexplorer.xyz'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: 'megaeth-testnet',
      url: NEW_RPC_URL,
      type: 'custom',
    },
  ],
});

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };
    const newStorage = await migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('NetworkController migration', () => {
    it('does nothing if `NetworkController` is missing', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {},
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual({});
    });

    it('does nothing if `NetworkController` is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: 'invalidData',
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing if `NetworkController.networkConfigurationsByChainId` is not an object', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: 'invalidData',
          },
        },
      };
      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('does nothing if MegaETH testnet is not configured', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                rpcEndpoints: [
                  {
                    networkClientId: 'mainnet',
                    url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://etherscan.io'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Ethereum Mainnet',
                nativeCurrency: 'ETH',
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(oldStorage.data);
    });

    it('migrates MegaETH testnet from old chain ID to new chain ID with new RPC URL', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              [OLD_CHAIN_ID]: getOldMegaEthTestnetConfiguration(),
            },
          },
        },
      };

      const expectedData = {
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networksMetadata: {},
          networkConfigurationsByChainId: {
            [NEW_CHAIN_ID]: getNewMegaEthTestnetConfiguration(),
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('updates selectedNetworkClientId if user was on MegaETH testnet', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'megaeth-testnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              [OLD_CHAIN_ID]: getOldMegaEthTestnetConfiguration(),
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      const networkController = newStorage.data.NetworkController as Record<
        string,
        unknown
      >;

      expect(networkController.selectedNetworkClientId).toBe('megaeth-testnet');
    });

    it('preserves custom RPC endpoints added by user but updates default one', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              [OLD_CHAIN_ID]: {
                ...getOldMegaEthTestnetConfiguration(),
                rpcEndpoints: [
                  {
                    networkClientId: 'megaeth-testnet',
                    url: OLD_RPC_URL,
                    type: 'custom',
                  },
                  {
                    networkClientId: 'custom-megaeth',
                    url: 'https://custom-rpc.example.com',
                    type: 'custom',
                  },
                ],
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      const networkController = newStorage.data.NetworkController as Record<
        string,
        unknown
      >;
      const networkConfigurationsByChainId =
        networkController.networkConfigurationsByChainId as Record<
          string,
          { rpcEndpoints: { url: string; networkClientId: string }[] }
        >;

      // Old chain ID should be removed
      expect(networkConfigurationsByChainId[OLD_CHAIN_ID]).toBeUndefined();

      // New chain ID should exist
      const newConfig = networkConfigurationsByChainId[NEW_CHAIN_ID];
      expect(newConfig).toBeDefined();
      expect(newConfig.rpcEndpoints).toHaveLength(2);

      // Default endpoint should be updated
      expect(newConfig.rpcEndpoints[0].url).toBe(NEW_RPC_URL);
      expect(newConfig.rpcEndpoints[0].networkClientId).toBe('megaeth-testnet');

      // Custom endpoint should be preserved (not updated since it's not the default)
      expect(newConfig.rpcEndpoints[1].url).toBe(
        'https://custom-rpc.example.com',
      );
      expect(newConfig.rpcEndpoints[1].networkClientId).toBe('custom-megaeth');
    });

    it('removes old chain ID and adds new chain ID', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              [OLD_CHAIN_ID]: getOldMegaEthTestnetConfiguration(),
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      const networkController = newStorage.data.NetworkController as Record<
        string,
        unknown
      >;
      const networkConfigurationsByChainId =
        networkController.networkConfigurationsByChainId as Record<
          string,
          unknown
        >;

      expect(networkConfigurationsByChainId[OLD_CHAIN_ID]).toBeUndefined();
      expect(networkConfigurationsByChainId[NEW_CHAIN_ID]).toBeDefined();
    });
  });
});
