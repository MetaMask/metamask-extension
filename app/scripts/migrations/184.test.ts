import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { jest } from '@jest/globals';
import { KnownCaipNamespace } from '@metamask/utils';
import {
  migrate,
  version,
  MEGAETH_TESTNET_V2_CONFIG,
  MEGAETH_TESTNET_V1_CHAIN_ID,
  type VersionedData,
} from './184';

const VERSION = version;
const oldVersion = VERSION - 1;

describe(`migration #${VERSION}`, () => {
  let mockedCaptureException: jest.Mock;
  beforeEach(() => {
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
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

    expect(newStorage.meta).toStrictEqual({ version: VERSION });
  });

  const invalidStates = [
    {
      state: {
        meta: { version: VERSION },
        data: {},
      },
      scenario: 'NetworkController not found',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: 'invalid',
        },
      },
      scenario: 'invalid NetworkController state',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {},
        },
      },
      scenario: 'missing networkConfigurationsByChainId property',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: 'invalid',
          },
        },
      },
      scenario: 'invalid networkConfigurationsByChainId state',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: 'invalid',
        },
      },
      scenario: 'invalid NetworkEnablementController state',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: 'invalid',
          },
        },
      },
      scenario: 'invalid enabledNetworkMap state',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {},
          },
        },
      },
      scenario: 'missing enabledNetworkMap property',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              eip155: 'invalid',
            },
          },
        },
      },
      scenario: 'invalid enabledNetworkMap[eip155] state',
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidStates)(
    'should capture exception if $scenario',
    async ({ state }: { errorMessage: string; state: VersionedData }) => {
      const orgState = cloneDeep(state);

      const migratedState = await migrate(state);

      // State should be unchanged
      expect(migratedState).toStrictEqual(orgState);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('initializes NetworkEnablementController when missing (e.g., during backup restoration)', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum Mainnet',
            },
            '0x5': {
              chainId: '0x5',
              name: 'Goerli',
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version: VERSION });
    expect(newStorage.data.NetworkEnablementController).toStrictEqual({
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          '0x1': false,
          '0x5': false,
          [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
        },
      },
    });
    expect(newStorage.data.NetworkController).toStrictEqual({
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
        },
        '0x5': {
          chainId: '0x5',
          name: 'Goerli',
        },
        [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
      },
    });
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('removes the megaeth testnet v1 network configuration and adds the megaeth testnet v2 network configuration', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V1_CHAIN_ID]: {
              chainId: MEGAETH_TESTNET_V1_CHAIN_ID,
              name: 'Mega Testnet',
              nativeCurrency: 'MegaETH',
              blockExplorerUrls: ['https://explorer.com'],
              defaultRpcEndpointIndex: 0,
              defaultBlockExplorerUrlIndex: 0,
              rpcEndpoints: [
                {
                  networkClientId: 'megaeth-testnet',
                  type: RpcEndpointType.Custom,
                  url: 'https://rpc.com',
                },
              ],
            },
          },
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [MEGAETH_TESTNET_V1_CHAIN_ID]: false,
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
          },
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  it('merges the megaeth testnet v2 network configuration if user already has it', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: {
              ...MEGAETH_TESTNET_V2_CONFIG,
              name: 'MegaETH Testnet custom',
              rpcEndpoints: [
                {
                  networkClientId: 'some-network-client-id',
                  type: RpcEndpointType.Custom,
                  url: 'https://timothy.megaeth.com/rpc',
                  failoverUrls: [],
                },
              ],
            },
          },
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: true,
            },
          },
        },
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: {
              ...MEGAETH_TESTNET_V2_CONFIG,
              rpcEndpoints: [
                {
                  networkClientId: 'some-network-client-id',
                  type: RpcEndpointType.Custom,
                  url: 'https://timothy.megaeth.com/rpc',
                  failoverUrls: [],
                },
              ],
            },
          },
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: true,
            },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
  });

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(['megaeth-testnet', 'random-network-client-id'])(
    'switchs to mainnet when the selected network client id is in MegaETH Testnet v1 - %s',
    async (selectedNetworkClientId: string) => {
      const oldStorage = {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              [MEGAETH_TESTNET_V1_CHAIN_ID]: {
                chainId: MEGAETH_TESTNET_V1_CHAIN_ID,
                name: 'Mega Testnet',
                nativeCurrency: 'MegaETH',
                blockExplorerUrls: ['https://explorer.com'],
                defaultRpcEndpointIndex: 0,
                defaultBlockExplorerUrlIndex: 0,
                rpcEndpoints: [
                  {
                    networkClientId: selectedNetworkClientId,
                    type: RpcEndpointType.Custom,
                    url: 'https://rpc.com',
                  },
                ],
              },
            },
            selectedNetworkClientId,
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                [MEGAETH_TESTNET_V1_CHAIN_ID]: false,
                // to simulate the mainnet is not being enabled
                '0x1': false,
              },
            },
          },
        },
      };

      const expectedStorage = {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
            },
            selectedNetworkClientId: 'mainnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
                '0x1': true,
              },
            },
          },
        },
      };

      const newStorage = await migrate(oldStorage);

      expect(newStorage).toStrictEqual(expectedStorage);
    },
  );
});
