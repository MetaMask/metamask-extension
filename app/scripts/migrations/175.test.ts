import { migrate, version } from './175';

const oldVersion = 174;

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

    it('does nothing if there are custom names', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              '0x1': {
                blockExplorerUrls: ['https://etherscan.io'],
                chainId: '0x1',
                defaultRpcEndpointIndex: 0,
                name: 'Ethereum Mainnet Custom',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'mainnet',
                    type: 'infura',
                    url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0xe708': {
                blockExplorerUrls: ['https://lineascan.build'],
                chainId: '0xe708',
                defaultRpcEndpointIndex: 0,
                name: 'Linea Custom',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'linea-mainnet',
                    type: 'infura',
                    url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0x2105': {
                blockExplorerUrls: ['https://basescan.org'],
                chainId: '0x2105',
                defaultRpcEndpointIndex: 0,
                name: 'Base Mainnet Custom',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'base-mainnet',
                    type: 'infura',
                    url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0xa4b1': {
                chainId: '0xa4b1',
                name: 'Arbitrum One Custom',
                nativeCurrency: 'ETH',
                blockExplorerUrls: ['https://explorer.arbitrum.io'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://arbitrum-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: '468bc365-5ad9-4dd8-97af-86e3cf659252',
                  },
                ],
                lastUpdatedAt: 1757337866918,
              },
              '0xa86a': {
                chainId: '0xa86a',
                name: 'Avalanche Network C-Chain Custom',
                nativeCurrency: 'AVAX',
                blockExplorerUrls: ['https://snowtrace.io/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://avalanche-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'd75ade0c-2a53-4b4e-8acf-0a040216290f',
                  },
                ],
                lastUpdatedAt: 1757337870947,
              },
              '0x38': {
                chainId: '0x38',
                name: 'Binance Smart Chain Custom',
                nativeCurrency: 'BNB',
                blockExplorerUrls: ['https://bscscan.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://bsc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'a2c6ed0c-3a18-4bae-874c-43ded891de40',
                  },
                ],
                lastUpdatedAt: 1757337874658,
              },
              '0xa': {
                chainId: '0xa',
                name: 'OP Mainnet Custom',
                nativeCurrency: 'ETH',
                blockExplorerUrls: ['https://optimistic.etherscan.io/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://optimism-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'c96c8704-0e00-409b-82ff-177ad023cfd9',
                  },
                ],
                lastUpdatedAt: 1757337879268,
              },
              '0x89': {
                chainId: '0x89',
                name: 'Polygon Mainnet Custom',
                nativeCurrency: 'POL',
                blockExplorerUrls: ['https://polygonscan.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://polygon-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'd46edd87-e0a1-44cf-86c5-a63c5a891c3b',
                  },
                ],
                lastUpdatedAt: 1757337882648,
              },
              '0x531': {
                chainId: '0x531',
                name: 'Sei Mainnet Custom',
                nativeCurrency: 'SEI',
                blockExplorerUrls: ['https://seitrace.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://sei-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    type: 'custom',
                    networkClientId: 'f33b668a-4c7f-43b8-94fb-23383be1c2eb',
                  },
                ],
                lastUpdatedAt: 1757337886644,
              },
            },
          },
        },
      };
      const newStorage = await migrate(oldState);
      expect(newStorage.data).toStrictEqual(oldState.data);
    });

    it('updates the old names to new ones', async () => {
      const oldState = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            selectedNetworkClientId: 'mainnet',
            networksMetadata: {},
            networkConfigurationsByChainId: {
              '0x1': {
                blockExplorerUrls: ['https://etherscan.io'],
                chainId: '0x1',
                defaultRpcEndpointIndex: 0,
                name: 'Ethereum Mainnet',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'mainnet',
                    type: 'infura',
                    url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0xe708': {
                blockExplorerUrls: ['https://lineascan.build'],
                chainId: '0xe708',
                defaultRpcEndpointIndex: 0,
                name: 'Linea',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'linea-mainnet',
                    type: 'infura',
                    url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0x2105': {
                blockExplorerUrls: ['https://basescan.org'],
                chainId: '0x2105',
                defaultRpcEndpointIndex: 0,
                name: 'Base Mainnet',
                nativeCurrency: 'ETH',
                rpcEndpoints: [
                  {
                    failoverUrls: [],
                    networkClientId: 'base-mainnet',
                    type: 'infura',
                    url: 'https://base-mainnet.infura.io/v3/{infuraProjectId}',
                  },
                ],
                defaultBlockExplorerUrlIndex: 0,
              },
              '0xa4b1': {
                chainId: '0xa4b1',
                name: 'Arbitrum One',
                nativeCurrency: 'ETH',
                blockExplorerUrls: ['https://explorer.arbitrum.io'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://arbitrum-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: '468bc365-5ad9-4dd8-97af-86e3cf659252',
                  },
                ],
                lastUpdatedAt: 1757337866918,
              },
              '0xa86a': {
                chainId: '0xa86a',
                name: 'Avalanche Network C-Chain',
                nativeCurrency: 'AVAX',
                blockExplorerUrls: ['https://snowtrace.io/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://avalanche-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'd75ade0c-2a53-4b4e-8acf-0a040216290f',
                  },
                ],
                lastUpdatedAt: 1757337870947,
              },
              '0x38': {
                chainId: '0x38',
                name: 'Binance Smart Chain',
                nativeCurrency: 'BNB',
                blockExplorerUrls: ['https://bscscan.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://bsc-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'a2c6ed0c-3a18-4bae-874c-43ded891de40',
                  },
                ],
                lastUpdatedAt: 1757337874658,
              },
              '0xa': {
                chainId: '0xa',
                name: 'OP Mainnet',
                nativeCurrency: 'ETH',
                blockExplorerUrls: ['https://optimistic.etherscan.io/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://optimism-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'c96c8704-0e00-409b-82ff-177ad023cfd9',
                  },
                ],
                lastUpdatedAt: 1757337879268,
              },
              '0x89': {
                chainId: '0x89',
                name: 'Polygon Mainnet',
                nativeCurrency: 'POL',
                blockExplorerUrls: ['https://polygonscan.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://polygon-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    failoverUrls: [],
                    type: 'custom',
                    networkClientId: 'd46edd87-e0a1-44cf-86c5-a63c5a891c3b',
                  },
                ],
                lastUpdatedAt: 1757337882648,
              },
              '0x531': {
                chainId: '0x531',
                name: 'Sei Mainnet',
                nativeCurrency: 'SEI',
                blockExplorerUrls: ['https://seitrace.com/'],
                defaultBlockExplorerUrlIndex: 0,
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [
                  {
                    url: 'https://sei-mainnet.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
                    type: 'custom',
                    networkClientId: 'f33b668a-4c7f-43b8-94fb-23383be1c2eb',
                  },
                ],
                lastUpdatedAt: 1757337886644,
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
            '0x1': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0x1'
              ],
              name: 'Ethereum',
            },
            '0xe708': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0xe708'
              ],
              name: 'Linea',
            },
            '0x2105': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0x2105'
              ],
              name: 'Base',
            },
            '0x38': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0x38'
              ],
              name: 'BNB Chain',
            },
            '0xa': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0xa'
              ],
              name: 'OP',
            },
            '0x89': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0x89'
              ],
              name: 'Polygon',
            },
            '0xa4b1': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0xa4b1'
              ],
              name: 'Arbitrum',
            },
            '0xa86a': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0xa86a'
              ],
              name: 'Avalanche',
            },
            '0x531': {
              ...oldState.data.NetworkController.networkConfigurationsByChainId[
                '0x531'
              ],
              name: 'Sei',
            },
          },
        },
      };

      const newStorage = await migrate(oldState);
      expect(newStorage.data).toStrictEqual(expectedData);
    });
  });
});
