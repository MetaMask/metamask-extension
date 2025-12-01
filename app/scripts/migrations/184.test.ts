import { NetworkState, RpcEndpointType } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { migrate, version } from './183';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

const oldVersion = 182;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
    // Mock process.env to allow migration logic to run
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

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('logs a warning and returns the original state if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${version}: NetworkController not found.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: 'not an object',
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController is not an object: string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not an object',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: string.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not modify state if `monad-testnet.infura.io` is already present in `Monad Testnet` network configuration', async () => {
    // Create a state with all supported FEATURED_RPCS networks already present
    const monadTestnetConfiguration = {
      chainId: CHAIN_IDS.MONAD_TESTNET,
      name: 'Monad Testnet',
      nativeCurrency: 'MONAD',
      rpcEndpoints: [
        {
          url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
          type: RpcEndpointType.Custom,
          networkClientId: 'existing-client-id',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
      defaultBlockExplorerUrlIndex: 0,
    };
    const existingNetworks = {
      [CHAIN_IDS.MONAD_TESTNET]: monadTestnetConfiguration,
    };


    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not modify state if `Monad Testnet` is not present in network configurations', async () => {
    const existingNetworks = {
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds `monad-testnet.infura.io` in `Monad Testnet` network configuration if not already present', async () => {
    const monadTestnetConfiguration = {
      chainId: CHAIN_IDS.MONAD_TESTNET,
      name: 'Monad Testnet',
      nativeCurrency: 'MONAD',
      rpcEndpoints: [
        {
          url: 'https://testnet-rpc.monad.xyz',
          type: RpcEndpointType.Custom,
          networkClientId: 'existing-client-id',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
      defaultBlockExplorerUrlIndex: 0,
    };

    const existingNetworks = {
      [CHAIN_IDS.MONAD_TESTNET]: monadTestnetConfiguration,
    };

    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[CHAIN_IDS.MONAD_TESTNET].rpcEndpoints,
    ).toStrictEqual(
      [
        {
          url: 'https://testnet-rpc.monad.xyz',
          type: RpcEndpointType.Custom,
          networkClientId: 'existing-client-id',
        },
        {
          url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
          type: RpcEndpointType.Custom,
          networkClientId: 'mocked-uuid-123',
        },
      ],
    );
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[CHAIN_IDS.MONAD_TESTNET].defaultRpcEndpointIndex,
    ).toStrictEqual((newStorage.data.NetworkController as NetworkState)
    .networkConfigurationsByChainId[CHAIN_IDS.MONAD_TESTNET].rpcEndpoints.length - 1);
  });
});
