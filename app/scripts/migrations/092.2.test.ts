import { NetworkType, toHex } from '@metamask/controller-utils';
import { NetworkStatus } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { version as currentStateVersion, migrate } from './092.2';

const TEST_NETWORK_CONTROLLER_STATE = {
  networkId: 'network-id',
  networkStatus: NetworkStatus.Available,
  providerConfig: {
    type: NetworkType.rpc,
    chainId: toHex(42),
    nickname: 'Funky Town Chain',
    ticker: 'ETH',
    id: 'test-network-client-id',
  },
  networkDetails: { EIPS: {} },
  networkConfigurations: {
    'network-configuration-id-1': {
      chainId: toHex(42),
      nickname: 'Localhost 8545',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
    },
  },
};

const anyPreviousStateVersion = 91;

describe('migration #96', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should update the state version number in the appropriate metadata field', async () => {
    const originalVersionedState = {
      meta: { version: anyPreviousStateVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(originalVersionedState));

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

    const updatedVersionedState = await migrate(
      cloneDeep(originalVersionedState),
    );
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

    const updatedVersionedState = await migrate(
      cloneDeep(originalVersionedState),
    );
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

    const updatedVersionedState = await migrate(
      cloneDeep(originalVersionedState),
    );
    expect(updatedVersionedState.data).not.toStrictEqual(originalMetaMaskState);
    expect(updatedVersionedState.data).toStrictEqual({
      anotherController: 'another-controller-state',
      NetworkController: TEST_NETWORK_CONTROLLER_STATE,
    });
  });
});
