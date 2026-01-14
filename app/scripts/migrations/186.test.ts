import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { KnownCaipNamespace } from '@metamask/utils';
import {
  migrate,
  version,
  MEGAETH_TESTNET_V2_CONFIG,
  MEGAETH_TESTNET_V1_CHAIN_ID,
  type VersionedData,
} from './186';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

const VERSION = version;
const oldVersion = VERSION - 1;
const mainnetConfiguration = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://explorer.com'],
    defaultRpcEndpointIndex: 0,
    defaultBlockExplorerUrlIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: 'custom',
        url: 'https://mainnet.com',
      },
    ],
  },
};

const lineaSepoliaConfiguration = {
  '0xe705': {
    chainId: '0xe705',
    name: 'Linea Sepolia',
    nativeCurrency: 'LineaETH',
    blockExplorerUrls: ['https://sepolia.lineascan.build'],
    defaultRpcEndpointIndex: 0,
    defaultBlockExplorerUrlIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'linea-sepolia',
        type: 'custom',
        url: 'https://mainnet.com',
      },
    ],
  },
};

const megaEthTestnetV1Configuration = {
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
        type: 'custom',
        url: 'https://rpc.com',
      },
    ],
  },
};

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
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    expect(oldStorage.meta).toStrictEqual({ version: VERSION });
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
          },
        },
      },
      scenario: 'missing selectedNetworkClientId property',
    },
    {
      state: {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {},
            selectedNetworkClientId: 123,
          },
        },
      },
      scenario: 'invalid selectedNetworkClientId type',
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidStates)(
    'should capture exception if $scenario',
    async ({ state }: { errorMessage: string; state: VersionedData }) => {
      const orgState = cloneDeep(state);
      const localChangedControllers = new Set<string>();

      await migrate(state, localChangedControllers);

      // State should be unchanged
      expect(state).toStrictEqual(orgState);
      expect(localChangedControllers.has('NetworkController')).toBe(false);
      expect(localChangedControllers.has('NetworkEnablementController')).toBe(
        false,
      );
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('removes the megaeth testnet v1 network configuration and adds the megaeth testnet v2 network configuration', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            ...mainnetConfiguration,
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
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [MEGAETH_TESTNET_V1_CHAIN_ID]: true,
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
            ...mainnetConfiguration,
            [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
          },
          selectedNetworkClientId: 'mainnet',
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
            },
          },
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    expect(oldStorage).toStrictEqual(expectedStorage);
    expect(localChangedControllers.has('NetworkController')).toBe(true);
    expect(localChangedControllers.has('NetworkEnablementController')).toBe(
      true,
    );
  });

  const invalidNetworkEnablementControllerStates = [
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
        },
      },
      scenario: 'missing NetworkEnablementController',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: 'invalid',
        },
      },
      scenario: 'invalid NetworkEnablementController state',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: {},
        },
      },
      scenario: 'missing enabledNetworkMap',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: { enabledNetworkMap: 'invalid' },
        },
      },
      scenario: 'invalid enabledNetworkMap state',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: { enabledNetworkMap: {} },
        },
      },
      scenario: 'missing Eip155 in enabledNetworkMap',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'megaeth-testnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: { [KnownCaipNamespace.Eip155]: 'invalid' },
          },
        },
      },
      scenario: 'invalid enabledNetworkMap Eip155 state',
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidNetworkEnablementControllerStates)(
    'does not update the enablement map and adds the megaeth testnet v2 network configuration and remove the megaeth testnet v1 network configuration if $scenario',
    async ({ state }: { state: VersionedData; scenario: string }) => {
      const localChangedControllers = new Set<string>();

      await migrate(state, localChangedControllers);

      // Should still add v2 and remove v1, but not update enablement map
      const networkController = state.data.NetworkController as {
        networkConfigurationsByChainId: Record<string, unknown>;
        selectedNetworkClientId: string;
      };
      expect(
        networkController.networkConfigurationsByChainId[
          MEGAETH_TESTNET_V2_CONFIG.chainId
        ],
      ).toBeDefined();
      expect(
        networkController.networkConfigurationsByChainId[
          MEGAETH_TESTNET_V1_CHAIN_ID
        ],
      ).toBeUndefined();
      expect(networkController.selectedNetworkClientId).toBe('mainnet');
      expect(localChangedControllers.has('NetworkController')).toBe(true);
      expect(localChangedControllers.has('NetworkEnablementController')).toBe(
        false,
      );
    },
  );

  const switchToMainnetScenarios = [
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...megaEthTestnetV1Configuration,
            },
            selectedNetworkClientId: 'mainnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                '0x1': false,
                [MEGAETH_TESTNET_V1_CHAIN_ID]: true,
              },
            },
          },
        },
      },
      scenario: 'the megaeth testnet v1 is enabled',
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(switchToMainnetScenarios)(
    'switchs to mainnet if $scenario',
    async ({ state }: { state: VersionedData; scenario: string }) => {
      const oldStorage = cloneDeep(state);
      const localChangedControllers = new Set<string>();

      const expectedStorage = {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
            },
            selectedNetworkClientId: 'mainnet',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                '0x1': true,
                [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
              },
            },
          },
        },
      };

      await migrate(oldStorage, localChangedControllers);

      expect(oldStorage).toStrictEqual(expectedStorage);
    },
  );

  const invalidSwitchToMainnetScenarios = [
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...lineaSepoliaConfiguration,
              [MEGAETH_TESTNET_V1_CHAIN_ID]: {
                ...megaEthTestnetV1Configuration[MEGAETH_TESTNET_V1_CHAIN_ID],
              },
            },
            selectedNetworkClientId: 'uuid',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                '0x1': false,
                '0xe705': true,
              },
            },
          },
        },
      },
      scenario: 'the megaeth testnet v1 is not enabled',
    },
    {
      state: {
        meta: { version: oldVersion },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...lineaSepoliaConfiguration,
              [MEGAETH_TESTNET_V1_CHAIN_ID]: {
                ...megaEthTestnetV1Configuration[MEGAETH_TESTNET_V1_CHAIN_ID],
              },
            },
            selectedNetworkClientId: 'uuid',
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: {
                '0x1': false,
                '0xe705': true,
                [MEGAETH_TESTNET_V1_CHAIN_ID]: true,
              },
            },
          },
        },
      },
      scenario: 'the megaeth testnet v1 is not enabled exclusively',
    },
  ];

  // @ts-expect-error 'each' function is not recognized by TypeScript types
  it.each(invalidSwitchToMainnetScenarios)(
    'does not switch to mainnet if $scenario',
    async ({ state }: { state: VersionedData; scenario: string }) => {
      const oldStorage = cloneDeep(state);
      const localChangedControllers = new Set<string>();
      const networkController = oldStorage.data.NetworkController as {
        selectedNetworkClientId: string;
      };
      const originalSelectedNetworkClientId =
        networkController.selectedNetworkClientId;

      const expectedStorage = {
        meta: { version: VERSION },
        data: {
          NetworkController: {
            networkConfigurationsByChainId: {
              ...mainnetConfiguration,
              ...lineaSepoliaConfiguration,
              [MEGAETH_TESTNET_V2_CONFIG.chainId]: MEGAETH_TESTNET_V2_CONFIG,
            },
            selectedNetworkClientId: originalSelectedNetworkClientId,
          },
          NetworkEnablementController: {
            enabledNetworkMap: {
              [KnownCaipNamespace.Eip155]: expect.objectContaining({
                '0x1': false,
                [MEGAETH_TESTNET_V2_CONFIG.chainId]: false,
              }),
            },
          },
        },
      };

      await migrate(oldStorage, localChangedControllers);

      expect(oldStorage).toStrictEqual(expectedStorage);
    },
  );

  it('adds MegaETH Testnet v2 to enabled network map if it does not exist', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
          selectedNetworkClientId: 'mainnet',
        },
        NetworkEnablementController: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              '0x1': true,
            },
          },
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    const eip155Map = oldStorage.data.NetworkEnablementController
      .enabledNetworkMap[KnownCaipNamespace.Eip155] as Record<string, boolean>;
    expect(eip155Map[MEGAETH_TESTNET_V2_CONFIG.chainId]).toBe(false);
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
          selectedNetworkClientId: 'mainnet',
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

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    // After migration, the name and nativeCurrency should be updated
    // and the new RPC endpoint should be added
    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        MEGAETH_TESTNET_V2_CONFIG.chainId
      ];
    expect(migratedConfig.name).toBe(MEGAETH_TESTNET_V2_CONFIG.name);
    expect(migratedConfig.nativeCurrency).toBe(
      MEGAETH_TESTNET_V2_CONFIG.nativeCurrency,
    );
    expect(migratedConfig.rpcEndpoints).toHaveLength(2);
    expect(migratedConfig.rpcEndpoints[0].url).toBe(
      'https://timothy.megaeth.com/rpc',
    );
    expect(migratedConfig.rpcEndpoints[1].url).toBe(
      'https://carrot.megaeth.com/rpc',
    );
    expect(migratedConfig.defaultRpcEndpointIndex).toBe(1);
    expect(migratedConfig.blockExplorerUrls).toContain(
      MEGAETH_TESTNET_V2_CONFIG.blockExplorerUrls[0],
    );
  });
});
