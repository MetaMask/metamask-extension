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

  const invalidNetworkControllerStates = [
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
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidNetworkControllerStates)(
    'should capture exception if $scenario',
    async ({ state }: { errorMessage: string; state: VersionedData }) => {
      const orgState = cloneDeep(state);

      const migratedState = await migrate(state);

      // State should be unchanged
      expect(migratedState).toStrictEqual(orgState);
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('should handle missing NetworkEnablementController gracefully and still migrate NetworkController', async () => {
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
          selectedNetworkClientId: 'megaeth-testnet',
        },
        // NetworkEnablementController is missing
      },
    };

    const expectedStorage = {
      meta: { version: VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
          },
          selectedNetworkClientId: 'megaeth-testnet',
        },
        // NetworkEnablementController still missing (not created by migration)
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage).toStrictEqual(expectedStorage);
    // Should not capture exception for missing NetworkEnablementController
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  const invalidNetworkEnablementControllerStates = [
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
  it.each(invalidNetworkEnablementControllerStates)(
    'should log warning and skip NetworkEnablementController migration if $scenario',
    async ({ state }: { errorMessage: string; state: VersionedData }) => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const oldStorage = cloneDeep(state);

      const migratedState = await migrate(oldStorage);

      // Version should be updated
      expect(migratedState.meta.version).toBe(VERSION);
      // NetworkController migration should still happen (adds MegaETH Testnet v2)
      expect(
        migratedState.data.NetworkController.networkConfigurationsByChainId[
          MEGAETH_TESTNET_V2_CONFIG.chainId
        ],
      ).toStrictEqual(MEGAETH_TESTNET_V2_CONFIG);
      // Should log warning but not capture exception
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('NetworkEnablementController'),
      );
      expect(mockedCaptureException).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    },
  );

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
