import { RpcEndpointType, NetworkState } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import {
  migrate,
  version,
  monadTestnetChainId,
  type VersionedData,
} from './186';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123'),
}));

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

  it('does not modify state if RPC `monad-testnet.infura.io` is already present in `Monad Testnet` network configuration', async () => {
    const monadTestnetConfiguration = {
      chainId: monadTestnetChainId,
      name: 'Monad Testnet',
      nativeCurrency: 'MON',
      rpcEndpoints: [
        {
          url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
          type: RpcEndpointType.Custom,
          networkClientId: 'custom-client-id',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
      defaultBlockExplorerUrlIndex: 0,
    };

    const existingNetworks = {
      [monadTestnetChainId]: monadTestnetConfiguration,
    };

    const orgState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const migratedState = await migrate(orgState);

    expect(migratedState.data).toStrictEqual(orgState.data);
  });

  it('does not modify state if `Monad Testnet` is not present in network configurations', async () => {
    const existingNetworks = {};

    const orgState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const migratedState = await migrate(orgState);

    expect(migratedState.data).toStrictEqual(orgState.data);
  });

  it('adds RPC `monad-testnet.infura.io` in `Monad Testnet` network configuration if not already present', async () => {
    const monadTestnetConfiguration = {
      chainId: monadTestnetChainId,
      name: 'Monad Testnet',
      nativeCurrency: 'MON',
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
      [monadTestnetChainId]: monadTestnetConfiguration,
    };

    const orgState = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: existingNetworks,
        },
      },
    };

    const migratedState = await migrate(orgState);

    expect(
      (migratedState.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[monadTestnetChainId].rpcEndpoints,
    ).toStrictEqual([
      {
        url: 'https://testnet-rpc.monad.xyz',
        type: RpcEndpointType.Custom,
        networkClientId: 'existing-client-id',
      },
      {
        url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
        type: RpcEndpointType.Infura,
        networkClientId: 'mocked-uuid-123',
      },
    ]);
    expect(
      (migratedState.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[monadTestnetChainId]
        .defaultRpcEndpointIndex,
    ).toStrictEqual(
      (migratedState.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId[monadTestnetChainId].rpcEndpoints
        .length - 1,
    );
  });
});
