import { cloneDeep } from 'lodash';

const mockUnitTestInfuraIdInitialValue = 'unitTestInfuraId';
let mockUnitTestInfuraId: string | undefined = mockUnitTestInfuraIdInitialValue;

jest.mock('../../../shared/constants/network', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('../../../shared/constants/network'),
  get infuraProjectId() {
    return mockUnitTestInfuraId;
  },
}));

// eslint-disable-next-line import/first
import { migrate, version, HYPEREVM_CHAIN_ID, type VersionedData } from './197';

const VERSION = version;
const oldVersion = VERSION - 1;

const NEW_INFURA_RPC = `https://hyperevm-mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`;
const QUICKNODE_HYPEREVM_URL = 'https://failover.com';

const hyperevmInitialConfiguration = {
  [HYPEREVM_CHAIN_ID]: {
    chainId: HYPEREVM_CHAIN_ID,
    name: 'HyperEVM',
    nativeCurrency: 'HYPE',
    blockExplorerUrls: ['https://explorer.com'],
    defaultRpcEndpointIndex: 0,
    defaultBlockExplorerUrlIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'hyperevm',
        type: 'custom',
        url: 'https://rpc.hyperliquid.xyz/evm',
        failoverUrls: [],
      },
    ],
  },
};

const HYPEREVM_CLEAN_CONFIG = {
  chainId: HYPEREVM_CHAIN_ID,
  name: 'HyperEVM',
  nativeCurrency: 'HYPE',
  blockExplorerUrls: ['https://hyperevmscan.io'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      failoverUrls: [QUICKNODE_HYPEREVM_URL],
      networkClientId: 'hyperevm',
      type: 'custom',
      url: NEW_INFURA_RPC,
    },
  ],
};

describe(`migration #${VERSION}`, () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockedCaptureException: jest.Mock;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.QUICKNODE_HYPEREVM_URL = QUICKNODE_HYPEREVM_URL;
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
    mockUnitTestInfuraId = mockUnitTestInfuraIdInitialValue;
  });

  afterEach(() => {
    process.env = originalEnv;
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
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('doesnt add the HyperEVM network if not present', async () => {
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
    expect(mockedCaptureException).not.toHaveBeenCalled();

    expect(
      oldStorage.data.NetworkController.networkConfigurationsByChainId,
    ).not.toHaveProperty(HYPEREVM_CHAIN_ID);
  });

  // Covers both cases where RPC and Infura are already the right values
  it('keeps HyperEVM config as is if already present and clean', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [HYPEREVM_CLEAN_CONFIG.chainId]: {
              ...HYPEREVM_CLEAN_CONFIG,
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);
    expect(mockedCaptureException).not.toHaveBeenCalled();

    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        HYPEREVM_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig).toStrictEqual(HYPEREVM_CLEAN_CONFIG);
  });

  it('merges the HyperEVM mainnet network configuration with new and old RPC URL if user already has one', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: hyperevmInitialConfiguration,
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    // After migration, the name and nativeCurrency should be updated
    // and the new RPC endpoint should be added
    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        HYPEREVM_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig.name).toBe(HYPEREVM_CLEAN_CONFIG.name);
    expect(migratedConfig.nativeCurrency).toBe(
      HYPEREVM_CLEAN_CONFIG.nativeCurrency,
    );
    expect(migratedConfig.rpcEndpoints).toHaveLength(2);
    expect(migratedConfig.rpcEndpoints[0].url).toBe(
      'https://rpc.hyperliquid.xyz/evm',
    );
    expect(migratedConfig.rpcEndpoints[0].failoverUrls).toEqual([]);
    expect(migratedConfig.rpcEndpoints[1].url).toBe(NEW_INFURA_RPC);
    expect(migratedConfig.rpcEndpoints[1].failoverUrls).toEqual([
      QUICKNODE_HYPEREVM_URL,
    ]);
    expect(migratedConfig.defaultRpcEndpointIndex).toBe(1);
    expect(migratedConfig.blockExplorerUrls).toEqual(['https://explorer.com']);
    expect(migratedConfig.defaultBlockExplorerUrlIndex).toBe(0);
  });

  it('leaves it untouched when Infura key project ID doesnt exist', async () => {
    mockUnitTestInfuraId = undefined;
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: hyperevmInitialConfiguration,
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    expect(mockedCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Infura project ID is not set, skip the HyperEVM RPC part of the migration',
        ),
      }),
    );
    // After migration, the name and nativeCurrency should be updated
    // and the new RPC endpoint should be added
    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        HYPEREVM_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig).toEqual(
      hyperevmInitialConfiguration[HYPEREVM_CHAIN_ID],
    );
  });

  it('only adds the failover if correct RPC already exists', async () => {
    // Same as intial expect Infura RPC is already there with no failover
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [HYPEREVM_CHAIN_ID]: {
              chainId: HYPEREVM_CHAIN_ID,
              name: 'HyperEVM',
              nativeCurrency: 'HYPE',
              blockExplorerUrls: ['https://explorer.com'],
              defaultRpcEndpointIndex: 1,
              defaultBlockExplorerUrlIndex: 0,
              rpcEndpoints: [
                {
                  networkClientId: 'hyperevm',
                  type: 'custom',
                  url: 'https://rpc.hyperliquid.xyz/evm',
                  failoverUrls: [],
                },
                {
                  networkClientId: 'hyperevm',
                  type: 'custom',
                  url: NEW_INFURA_RPC,
                  failoverUrls: [],
                },
              ],
            },
          },
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    // After migration, the name and nativeCurrency should be updated
    // and the new RPC endpoint should be added
    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        HYPEREVM_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig.name).toBe(HYPEREVM_CLEAN_CONFIG.name);
    expect(migratedConfig.nativeCurrency).toBe(
      HYPEREVM_CLEAN_CONFIG.nativeCurrency,
    );
    expect(migratedConfig.rpcEndpoints).toHaveLength(2);
    expect(migratedConfig.rpcEndpoints[0].url).toBe(
      'https://rpc.hyperliquid.xyz/evm',
    );
    expect(migratedConfig.rpcEndpoints[0].failoverUrls).toEqual([]);
    expect(migratedConfig.rpcEndpoints[1].url).toBe(NEW_INFURA_RPC);
    expect(migratedConfig.rpcEndpoints[1].failoverUrls).toEqual([
      QUICKNODE_HYPEREVM_URL,
    ]);
    expect(migratedConfig.defaultRpcEndpointIndex).toBe(1);
    expect(migratedConfig.blockExplorerUrls).toEqual(['https://explorer.com']);
    expect(migratedConfig.defaultBlockExplorerUrlIndex).toBe(0);
  });
});
