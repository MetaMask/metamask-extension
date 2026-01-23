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
import {
  migrate,
  version,
  MEGAETH_MAINNET_CHAIN_ID,
  type VersionedData,
} from './189';

const VERSION = version;
const oldVersion = VERSION - 1;

const megaEthMainnetInitialConfiguration = {
  [MEGAETH_MAINNET_CHAIN_ID]: {
    chainId: MEGAETH_MAINNET_CHAIN_ID,
    name: 'MegaETH Mainnet',
    nativeCurrency: 'ETH',
    blockExplorerUrls: ['https://explorer.com'],
    defaultRpcEndpointIndex: 0,
    defaultBlockExplorerUrlIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'megaeth-mainnet',
        type: 'custom',
        url: 'https://rpc.com',
      },
    ],
  },
};

const MEGAETH_MAINNET_CLEAN_CONFIG = {
  chainId: MEGAETH_MAINNET_CHAIN_ID,
  name: 'MegaETH Mainnet',
  nativeCurrency: 'ETH',
  blockExplorerUrls: ['https://megaeth.blockscout.com'],
  defaultRpcEndpointIndex: 0,
  defaultBlockExplorerUrlIndex: 0,
  rpcEndpoints: [
    {
      failoverUrls: [],
      networkClientId: 'megaeth-mainnet',
      type: 'custom',
      url: `https://megaeth-mainnet.infura.io/v3/${mockUnitTestInfuraIdInitialValue}`,
    },
  ],
};

describe(`migration #${VERSION}`, () => {
  let mockedCaptureException: jest.Mock;
  beforeEach(() => {
    mockedCaptureException = jest.fn();
    global.sentry = { captureException: mockedCaptureException };
    mockUnitTestInfuraId = mockUnitTestInfuraIdInitialValue;
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
      expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    },
  );

  it('doesnt add the MegaETH network if not present', async () => {
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
    ).not.toHaveProperty(MEGAETH_MAINNET_CHAIN_ID);
  });

  // Covers both cases where RPC and Infura are already the right values
  it('keeps MegaETH config as is if already present and clean', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            [MEGAETH_MAINNET_CLEAN_CONFIG.chainId]: {
              ...MEGAETH_MAINNET_CLEAN_CONFIG,
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
        MEGAETH_MAINNET_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig).toStrictEqual(MEGAETH_MAINNET_CLEAN_CONFIG);
  });

  it('merges the MegaETH mainnet network configuration with both RPC and block exploer URL if user already has it', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: megaEthMainnetInitialConfiguration,
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
        MEGAETH_MAINNET_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig.name).toBe(MEGAETH_MAINNET_CLEAN_CONFIG.name);
    expect(migratedConfig.nativeCurrency).toBe(
      MEGAETH_MAINNET_CLEAN_CONFIG.nativeCurrency,
    );
    expect(migratedConfig.rpcEndpoints).toHaveLength(2);
    expect(migratedConfig.rpcEndpoints[0].url).toBe('https://rpc.com');
    expect(migratedConfig.rpcEndpoints[1].url).toBe(
      `https://megaeth-mainnet.infura.io/v3/${mockUnitTestInfuraId}`,
    );
    expect(migratedConfig.defaultRpcEndpointIndex).toBe(1);
    expect(migratedConfig.blockExplorerUrls).toEqual([
      'https://explorer.com',
      'https://megaeth.blockscout.com',
    ]);
    expect(migratedConfig.defaultBlockExplorerUrlIndex).toBe(1);
  });

  it('only changes the blockExplorer RPC when Infura key project ID doesnt exist', async () => {
    mockUnitTestInfuraId = undefined;
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: megaEthMainnetInitialConfiguration,
          selectedNetworkClientId: 'mainnet',
        },
      },
    };

    const localChangedControllers = new Set<string>();
    await migrate(oldStorage, localChangedControllers);

    expect(mockedCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Infura project ID is not set, skip the MegaETH RPC part of the migration',
        ),
      }),
    );
    // After migration, the name and nativeCurrency should be updated
    // and the new RPC endpoint should be added
    const migratedConfig =
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        MEGAETH_MAINNET_CLEAN_CONFIG.chainId
      ];
    expect(migratedConfig.name).toBe(MEGAETH_MAINNET_CLEAN_CONFIG.name);
    expect(migratedConfig.nativeCurrency).toBe(
      MEGAETH_MAINNET_CLEAN_CONFIG.nativeCurrency,
    );
    expect(migratedConfig.rpcEndpoints).toHaveLength(1);
    expect(migratedConfig.rpcEndpoints[0].url).toBe('https://rpc.com');
    expect(migratedConfig.defaultRpcEndpointIndex).toBe(0);
    expect(migratedConfig.blockExplorerUrls).toEqual([
      'https://explorer.com',
      'https://megaeth.blockscout.com',
    ]);
    expect(migratedConfig.defaultBlockExplorerUrlIndex).toBe(1);
  });
});
