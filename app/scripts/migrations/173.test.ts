import { migrate, version } from './173';

const oldVersion = 172;

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

    it('does nothing if SEI network name is not `Sei Network`', async () => {
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
              '0x531': {
                chainId: '0x531',
                rpcEndpoints: [
                  {
                    networkClientId: 'sei-network',
                    url: 'https://sei-mainnet.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://seitrace.com'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Custom Sei Network',
                nativeCurrency: 'SEI',
              },
            },
          },
        },
      };
      const newStorage = await migrate(oldState);
      expect(newStorage.data).toStrictEqual(oldState.data);
    });

    it('updates the SEI network name from `Sei Network` to `Sei`', async () => {
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
              '0x531': {
                chainId: '0x531',
                rpcEndpoints: [
                  {
                    networkClientId: 'sei-network',
                    url: 'https://sei-mainnet.infura.io/v3/{infuraProjectId}',
                    type: 'infura',
                  },
                ],
                defaultRpcEndpointIndex: 0,
                blockExplorerUrls: ['https://seitrace.com'],
                defaultBlockExplorerUrlIndex: 0,
                name: 'Sei Network',
                nativeCurrency: 'SEI',
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
