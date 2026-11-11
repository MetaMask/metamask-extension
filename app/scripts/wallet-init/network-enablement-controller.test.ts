import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
  type ActionConstraint,
  type EventConstraint,
} from '@metamask/messenger';
import type {
  NetworkEnablementController,
  NetworkEnablementControllerStateChangeEvent,
} from '@metamask/network-enablement-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import type { MessengerClientPersistedState } from '../messenger-client-init/types';
import { getRootMessenger } from '../lib/messenger';
import { setupNetworkEnablementController } from './network-enablement-controller';

function createMessengerClient(): jest.Mocked<NetworkEnablementController> {
  return {
    state: {
      enabledNetworkMap: {},
      nativeAssetIdentifiers: {},
    },
    init: jest.fn().mockResolvedValue(undefined),
    enableNetwork: jest.fn(),
    enableAllPopularNetworks: jest.fn(),
    enableNetworkInNamespace: jest.fn(),
    restoreEnabledNetworkMap: jest.fn(),
  } as unknown as jest.Mocked<NetworkEnablementController>;
}

function getInitRequestMock<
  AllowedActions extends ActionConstraint = never,
  AllowedEvents extends EventConstraint = never,
>(
  baseMessenger: Messenger<
    MockAnyNamespace,
    AllowedActions,
    AllowedEvents
  > = getRootMessenger<AllowedActions, AllowedEvents>(),
) {
  return {
    baseMessenger,
    messengerClient: createMessengerClient(),
    persistedState: {} as MessengerClientPersistedState,
  };
}

function runNetworkEnablementSetup(
  request: ReturnType<typeof getInitRequestMock>,
) {
  setupNetworkEnablementController({
    networkEnablementController: request.messengerClient,
    messenger: request.baseMessenger as never,
    persistedState: request.persistedState,
  });

  return { messengerClient: request.messengerClient };
}

describe('NetworkEnablementControllerInit', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.IN_TEST = '';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.useRealTimers();
  });

  it('initializes the controller', () => {
    const { messengerClient } = runNetworkEnablementSetup(getInitRequestMock());
    expect(messengerClient.init).toHaveBeenCalledTimes(1);
  });

  it('reports a failed initialization', async () => {
    const captureException = jest.fn();
    const request = getInitRequestMock(
      new Messenger({ namespace: MOCK_ANY_NAMESPACE, captureException }),
    );
    request.messengerClient.init.mockRejectedValue(new Error('failed'));
    runNetworkEnablementSetup(request);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(captureException).toHaveBeenCalledWith(new Error('failed'));
  });

  it('enables the Solana network when `AccountsController:selectedAccountChange` is emitted', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      never,
      AccountsControllerSelectedAccountChangeEvent
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });
    const request = getInitRequestMock(messenger);
    const { messengerClient } = runNetworkEnablementSetup(request);

    expect(messengerClient.enableNetworkInNamespace).not.toHaveBeenCalled();

    // @ts-expect-error: Partial mock.
    messenger.publish('AccountsController:selectedAccountChange', {
      type: SolAccountType.DataAccount,
    });

    expect(messengerClient.enableNetworkInNamespace).toHaveBeenCalledWith(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      'solana',
    );
  });

  it('enables the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted, the current chain ID is Solana mainnet, and there are no Solana accounts', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { messengerClient } = runNetworkEnablementSetup(request);

    messengerClient.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
      },
      nativeAssetIdentifiers: {},
    };

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(messengerClient.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('enables the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted, the current chain ID is Bitcoin mainnet, and there are no Bitcoin accounts', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { messengerClient } = runNetworkEnablementSetup(request);

    messengerClient.state = {
      enabledNetworkMap: {
        bitcoin: { [BtcScope.Mainnet]: true },
      },
      nativeAssetIdentifiers: {},
    };

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(messengerClient.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('does not enable the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted and there are accounts', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >({ namespace: MOCK_ANY_NAMESPACE });

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      // @ts-expect-error: Partial mock.
      () => [{ type: SolAccountType.DataAccount }],
    );

    const request = getInitRequestMock(messenger);
    const { messengerClient } = runNetworkEnablementSetup(request);

    messengerClient.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
      },
      nativeAssetIdentifiers: {},
    };

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();
  });

  it('does not enable the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted and multiple networks are enabled', () => {
    const messenger = new Messenger<
      MockAnyNamespace,
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >({ namespace: MOCK_ANY_NAMESPACE });

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { messengerClient } = runNetworkEnablementSetup(request);

    messengerClient.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
        bitcoin: { [BtcScope.Mainnet]: true },
      },
      nativeAssetIdentifiers: {},
    };

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();
  });

  [
    ['production', ''],
    ['production', 'true'],
    ['testing', ''],
  ].forEach(([environment, debug]) => {
    it(`initialises fresh ${environment} builds with all default networks`, () => {
      process.env.METAMASK_DEBUG = debug;
      process.env.METAMASK_ENVIRONMENT = environment;
      process.env.IN_TEST = '';

      const { messengerClient } =
        runNetworkEnablementSetup(getInitRequestMock());

      expect(messengerClient.enableAllPopularNetworks).toHaveBeenCalledTimes(1);
    });
  });

  it('initialises the controller with only localhost enabled in test builds', () => {
    process.env.IN_TEST = 'true';

    const { messengerClient } = runNetworkEnablementSetup(getInitRequestMock());

    expect(messengerClient.enableNetwork).toHaveBeenCalledWith(
      CHAIN_IDS.LOCALHOST,
    );
    expect(messengerClient.enableAllPopularNetworks).not.toHaveBeenCalled();
  });

  it('keeps the persisted network selection', () => {
    process.env.IN_TEST = '';

    const request = getInitRequestMock();
    request.persistedState = {
      NetworkEnablementController: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
          },
        },
        nativeAssetIdentifiers: {},
      },
    };

    const { messengerClient } = runNetworkEnablementSetup(request);

    expect(messengerClient.enableAllPopularNetworks).not.toHaveBeenCalled();
    expect(messengerClient.enableNetwork).not.toHaveBeenCalled();
  });

  it('preserves a single filter when Config Registry auto-adds Arc', async () => {
    process.env.IN_TEST = 'true';
    const messenger = new Messenger<
      MockAnyNamespace,
      never,
      NetworkEnablementControllerStateChangeEvent
    >({ namespace: MOCK_ANY_NAMESPACE });
    const request = getInitRequestMock(messenger);
    messenger.registerActionHandler(
      'ConfigRegistryController:getState' as never,
      () =>
        ({
          configs: {
            networks: {
              'eip155:5042': {
                chainId: 'eip155:5042',
                config: {
                  isActive: true,
                  isAutoEnabled: true,
                  isDeprecated: false,
                },
              },
            },
          },
        }) as never,
    );

    const { messengerClient } = runNetworkEnablementSetup(request);
    messengerClient.state = {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.LOCALHOST]: true,
          [CHAIN_IDS.ARC]: false,
        },
      },
      nativeAssetIdentifiers: {},
    };

    // @ts-expect-error: Partial mock.
    messenger.publish('NetworkController:networkAdded', {
      chainId: CHAIN_IDS.ARC,
    } as never);

    messengerClient.state.enabledNetworkMap[KnownCaipNamespace.Eip155][
      CHAIN_IDS.ARC
    ] = true;
    request.baseMessenger.publish(
      'NetworkEnablementController:stateChange',
      {
        enabledNetworkMap: messengerClient.state.enabledNetworkMap,
        nativeAssetIdentifiers: messengerClient.state.nativeAssetIdentifiers,
      },
      [],
    );

    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(messengerClient.restoreEnabledNetworkMap).toHaveBeenCalledWith({
      [KnownCaipNamespace.Eip155]: {
        [CHAIN_IDS.LOCALHOST]: true,
        [CHAIN_IDS.ARC]: false,
      },
    });
  });

  it('preserves all-default mode when Config Registry auto-adds Arc', async () => {
    process.env.IN_TEST = 'true';
    const messenger = new Messenger<
      MockAnyNamespace,
      never,
      NetworkEnablementControllerStateChangeEvent
    >({ namespace: MOCK_ANY_NAMESPACE });
    const request = getInitRequestMock(messenger);
    messenger.registerActionHandler(
      'ConfigRegistryController:getState' as never,
      () =>
        ({
          configs: {
            networks: {
              'eip155:5042': {
                chainId: 'eip155:5042',
                config: {
                  isActive: true,
                  isAutoEnabled: true,
                  isDeprecated: false,
                },
              },
            },
          },
        }) as never,
    );

    const { messengerClient } = runNetworkEnablementSetup(request);
    messengerClient.state = {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.POLYGON]: true,
          [CHAIN_IDS.ARC]: false,
        },
      },
      nativeAssetIdentifiers: {},
    };

    // @ts-expect-error: Partial mock.
    messenger.publish('NetworkController:networkAdded', {
      chainId: CHAIN_IDS.ARC,
    } as never);

    messengerClient.state.enabledNetworkMap[KnownCaipNamespace.Eip155][
      CHAIN_IDS.ARC
    ] = true;
    request.baseMessenger.publish(
      'NetworkEnablementController:stateChange',
      {
        enabledNetworkMap: messengerClient.state.enabledNetworkMap,
        nativeAssetIdentifiers: messengerClient.state.nativeAssetIdentifiers,
      },
      [],
    );

    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(messengerClient.restoreEnabledNetworkMap).toHaveBeenCalledWith({
      [KnownCaipNamespace.Eip155]: {
        [CHAIN_IDS.MAINNET]: true,
        [CHAIN_IDS.POLYGON]: true,
        [CHAIN_IDS.ARC]: false,
      },
    });
  });

  it('does not preserve the filter when a non-registry network is added', () => {
    process.env.IN_TEST = 'true';
    const messenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });
    const request = getInitRequestMock(messenger);
    messenger.registerActionHandler(
      'ConfigRegistryController:getState' as never,
      () => ({ configs: { networks: {} } }) as never,
    );

    const { messengerClient } = runNetworkEnablementSetup(request);
    messengerClient.state = {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.LOCALHOST]: true,
          [CHAIN_IDS.ARC]: false,
        },
      },
      nativeAssetIdentifiers: {},
    };

    // @ts-expect-error: Partial mock.
    messenger.publish('NetworkController:networkAdded', {
      chainId: CHAIN_IDS.ARC,
    } as never);

    expect(messengerClient.restoreEnabledNetworkMap).not.toHaveBeenCalled();
  });

  it('skips restore when a user-initiated addition is marked', async () => {
    process.env.IN_TEST = 'true';
    const messenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });
    const request = getInitRequestMock(messenger);
    messenger.registerActionHandler(
      'ConfigRegistryController:getState' as never,
      () =>
        ({
          configs: {
            networks: {
              'eip155:5042': {
                chainId: 'eip155:5042',
                config: {
                  isActive: true,
                  isAutoEnabled: true,
                  isDeprecated: false,
                },
              },
            },
          },
        }) as never,
    );

    // Import and mock the Set
    const { userInitiatedNetworkAdditions } = jest.requireActual(
      '../../services/legacy-background-api-service',
    );

    const { messengerClient } = runNetworkEnablementSetup(request);
    messengerClient.state = {
      enabledNetworkMap: {
        [KnownCaipNamespace.Eip155]: {
          [CHAIN_IDS.LOCALHOST]: true,
          [CHAIN_IDS.ARC]: false,
        },
      },
      nativeAssetIdentifiers: {},
    };

    // Mark this as a user-initiated addition
    userInitiatedNetworkAdditions.add(CHAIN_IDS.ARC);

    try {
      // @ts-expect-error: Partial mock.
      messenger.publish('NetworkController:networkAdded', {
        chainId: CHAIN_IDS.ARC,
      } as never);

      messengerClient.state.enabledNetworkMap[KnownCaipNamespace.Eip155][
        CHAIN_IDS.ARC
      ] = true;
      request.controllerMessenger.publish(
        'NetworkEnablementController:stateChange',
        {
          enabledNetworkMap: messengerClient.state.enabledNetworkMap,
        } as never,
        [] as never,
      );

      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should NOT restore because this is a user-initiated addition
      expect(messengerClient.restoreEnabledNetworkMap).not.toHaveBeenCalled();
    } finally {
      userInitiatedNetworkAdditions.delete(CHAIN_IDS.ARC);
    }
  });

  it('reports a timeout when an auto-added network is never enabled', async () => {
    jest.useFakeTimers();
    const captureException = jest.fn();
    const messenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
      captureException,
    });
    const request = getInitRequestMock(messenger);
    messenger.registerActionHandler(
      'ConfigRegistryController:getState' as never,
      () =>
        ({
          configs: {
            networks: {
              'eip155:5042': {
                chainId: 'eip155:5042',
                config: {
                  isActive: true,
                  isAutoEnabled: true,
                  isDeprecated: false,
                },
              },
            },
          },
        }) as never,
    );

    const { messengerClient } = runNetworkEnablementSetup(request);

    // @ts-expect-error: Partial mock.
    messenger.publish('NetworkController:networkAdded', {
      chainId: CHAIN_IDS.ARC,
    } as never);
    await jest.advanceTimersByTimeAsync(30_000);

    expect(captureException).toHaveBeenCalledWith(
      new Error(`Timed out waiting for ${CHAIN_IDS.ARC} to be enabled`),
    );
    expect(messengerClient.restoreEnabledNetworkMap).not.toHaveBeenCalled();
  });
});
