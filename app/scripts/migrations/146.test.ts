import { ChainId } from '@metamask/controller-utils';

import { migrate, version } from './146';

const oldVersion = 145;
const megaEthChainId = ChainId['megaeth-testnet'];

/**
 * Get the MegaETH testnet network configuration object as snapshot.
 *
 * @returns The MegaETH testnet network configuration object.
 */
const getMegaEthTestnetConfiguration = () => ({
  chainId: megaEthChainId,
  name: 'Mega Testnet',
  nativeCurrency: 'MegaETH',
  blockExplorerUrls: ['https://megaexplorer.xyz'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      networkClientId: 'megaeth-testnet',
      url: 'https://carrot.megaeth.com/rpc',
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

  describe(`migration #${version}`, () => {
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

    it('adds a new network `MegaETH` to `NetworkController.networkConfigurationsByChainId`', async () => {
      const oldState = {
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
              '0xaa36a7': {
                chainId: '0xaa36a7',
                rpcEndpoints: [
                  {
                    networkClientId: 'sepolia',
                    url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Sepolia',
                nativeCurrency: 'SepoliaETH',
              },
              '0xe705': {
                chainId: '0xe705',
                rpcEndpoints: [
                  {
                    networkClientId: 'linea-sepolia',
                    url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://sepolia.lineascan.build'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Linea Sepolia',
                nativeCurrency: 'LineaETH',
              },
              '0xe708': {
                chainId: '0xe708',
                rpcEndpoints: [
                  {
                    networkClientId: 'linea-mainnet',
                    url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://lineascan.build'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Linea Mainnet',
                nativeCurrency: 'ETH',
              },
            },
          },
        },
      };

      const expectedData = {
        NetworkController: {
          ...oldState.data.NetworkController,
          networkConfigurationsByChainId: {
            ...oldState.data.NetworkController.networkConfigurationsByChainId,
            [megaEthChainId]: getMegaEthTestnetConfiguration(),
          },
        },
      };

      const newStorage = await migrate(oldState);
      expect(newStorage.data).toStrictEqual(expectedData);
    });

    it('updates the `MegaETH` network if it has already in `NetworkController.networkConfigurationsByChainId`', async () => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              [megaEthChainId]: {
                ...getMegaEthTestnetConfiguration(),
                name: 'Some other name',
              },
            },
          },
        },
      };

      const expectedData = {
        NetworkController: {
          ...oldStorage.data.NetworkController,
          networkConfigurationsByChainId: {
            ...oldStorage.data.NetworkController.networkConfigurationsByChainId,
            [megaEthChainId]: getMegaEthTestnetConfiguration(),
          },
        },
      };

      const newStorage = await migrate(oldStorage);
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
