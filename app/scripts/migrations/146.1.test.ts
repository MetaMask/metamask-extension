import { migrate } from './146.1';

const expectedVersion = 146.1;
const previousVersion = 146;

describe(`migration #${expectedVersion}`, () => {
  it('does nothing if state.NetworkController has no networkConfigurationsByChainId property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {},
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not-an-object',
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController.selectedNetworkClientId is not defined', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {},
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if selectedNetworkClientId is already defined and exists in networkConfigurationsByChainId', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              blockExplorerUrls: ['https://etherscan.io'],
              chainId: '0x1',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  type: 'infura',
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0x18c6': {
              blockExplorerUrls: ['https://megaexplorer.xyz'],
              chainId: '0x18c6',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Mega Testnet',
              nativeCurrency: 'MegaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'megaeth-testnet',
                  type: 'custom',
                  url: 'https://carrot.megaeth.com/rpc',
                },
              ],
            },
            '0xaa36a7': {
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
              chainId: '0xaa36a7',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Sepolia',
              nativeCurrency: 'SepoliaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'sepolia',
                  type: 'infura',
                  url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0xe705': {
              blockExplorerUrls: ['https://sepolia.lineascan.build'],
              chainId: '0xe705',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Linea Sepolia',
              nativeCurrency: 'LineaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'linea-sepolia',
                  type: 'infura',
                  url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0xe708': {
              blockExplorerUrls: ['https://lineascan.build'],
              chainId: '0xe708',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Linea',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  networkClientId: 'linea-mainnet',
                  type: 'infura',
                  url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
          },
          networksMetadata: {
            '17a6de2b-a6b9-4b2c-8ea5-e8b6a97e0cc4': {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
            mainnet: {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
            sepolia: {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('switches to mainnet if selectedNetworkClientId does not exist in networkConfigurationsByChainId', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              blockExplorerUrls: ['https://etherscan.io'],
              chainId: '0x1',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Ethereum Mainnet',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  type: 'infura',
                  url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0x18c6': {
              blockExplorerUrls: ['https://megaexplorer.xyz'],
              chainId: '0x18c6',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Mega Testnet',
              nativeCurrency: 'MegaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'megaeth-testnet',
                  type: 'custom',
                  url: 'https://carrot.megaeth.com/rpc',
                },
              ],
            },
            '0xaa36a7': {
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
              chainId: '0xaa36a7',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Sepolia',
              nativeCurrency: 'SepoliaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'sepolia',
                  type: 'infura',
                  url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0xe705': {
              blockExplorerUrls: ['https://sepolia.lineascan.build'],
              chainId: '0xe705',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Linea Sepolia',
              nativeCurrency: 'LineaETH',
              rpcEndpoints: [
                {
                  networkClientId: 'linea-sepolia',
                  type: 'infura',
                  url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
            '0xe708': {
              blockExplorerUrls: ['https://lineascan.build'],
              chainId: '0xe708',
              defaultBlockExplorerUrlIndex: 0,
              defaultRpcEndpointIndex: 0,
              name: 'Linea',
              nativeCurrency: 'ETH',
              rpcEndpoints: [
                {
                  networkClientId: 'linea-mainnet',
                  type: 'infura',
                  url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
                },
              ],
            },
          },
          networksMetadata: {
            '17a6de2b-a6b9-4b2c-8ea5-e8b6a97e0cc4': {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
            mainnet: {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
            sepolia: {
              EIPS: {
                '1559': true,
              },
              status: 'available',
            },
          },
          selectedNetworkClientId: '17a6de2b-a6b9-4b2c-8ea5-e8b6a97e0cc4',
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        ...oldVersionedData.data,
        NetworkController: {
          ...oldVersionedData.data.NetworkController,
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
