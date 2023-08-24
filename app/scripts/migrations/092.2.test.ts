import { NetworkType } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { migrate, version as currentStateVersion } from './092.2';

const TEST_NETWORK_CONTROLLER_STATE = {
  selectedNetworkClientId: 'test-network-client-id',
  networkId: 'sdf',
  providerConfig: {
    type: NetworkType.rpc,
    chainId: '0x9393',
    nickname: 'Funky Town Chain',
    ticker: 'ETH',
    id: 'test-network-client-id',
  },
  networkConfigurations: {
    'network-configuration-id-1': {
      chainId: '0x539',
      nickname: 'Localhost 8545',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
    },
  },
  networksMetadata: {
    'test-network-client-id': {
      status: NetworkStatus.Available,
      EIPS: {},
    },
  },
};

const anyPreviousStateVersion = Math.floor(
  Math.random() * (currentStateVersion - 1) + 1,
);

describe('migration #96', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the state version number in the appropriate metadata field', async () => {
    const originalVersionedState = {
      meta: { version: anyPreviousStateVersion },
      data: {},
    };

    const newStorage = await migrate(originalVersionedState);

    expect(newStorage.meta).toStrictEqual({ version: currentStateVersion });
  });

  it('should return state unaltered if there is no network controller state', async () => {
    const originalMetaMaskState = {
      anotherController: 'another-controller-state',
    };
    const originalVersionedState = {
      meta: { version: anyPreviousStateVersion },
      data: originalMetaMaskState,
    };

    const updatedVersionedState = await migrate(originalVersionedState);
    expect(updatedVersionedState.data).toStrictEqual(originalMetaMaskState);
  });

  it('should return unaltered state if there are no obsolete network controller state properties', async () => {
    const originalMetaMaskState = {
      anotherController: 'another-controller-state',
      NetworkController: TEST_NETWORK_CONTROLLER_STATE,
    };
    const originalVersionedState = {
      meta: { version: anyPreviousStateVersion },
      data: originalMetaMaskState,
    };

    const updatedVersionedState = await migrate(originalVersionedState);
    expect(updatedVersionedState.data).toStrictEqual(originalMetaMaskState);
  });

  it('should return updated state without obsolete network controller state properties', async () => {
    const originalMetaMaskState = {
      anotherController: 'another-controller-state',
      NetworkController: {
        ...TEST_NETWORK_CONTROLLER_STATE,
        someSortOfRogueObsoleteStateProperty: 'exists',
      },
    };
    const originalVersionedState = {
      meta: { version: anyPreviousStateVersion },
      data: originalMetaMaskState,
    };

    const updatedVersionedState = await migrate(originalVersionedState);
    expect(updatedVersionedState.data).not.toStrictEqual(originalMetaMaskState);
    expect(updatedVersionedState.data).toStrictEqual({
      anotherController: 'another-controller-state',
      NetworkController: TEST_NETWORK_CONTROLLER_STATE,
    });
  });
});
