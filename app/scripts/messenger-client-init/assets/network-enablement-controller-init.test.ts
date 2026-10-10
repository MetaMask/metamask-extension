import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  NetworkEnablementController,
  NetworkEnablementControllerMessenger,
} from '@metamask/network-enablement-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getNetworkEnablementControllerInitMessenger,
  getNetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger,
} from '../messengers/assets';
import { getRootMessenger } from '../../lib/messenger';
import { NetworkEnablementControllerInit } from './network-enablement-controller-init';

jest.mock('@metamask/network-enablement-controller');

function getInitRequestMock(
  baseMessenger = getRootMessenger<never, never>(),
): jest.Mocked<
  MessengerClientInitRequest<
    NetworkEnablementControllerMessenger,
    NetworkEnablementControllerInitMessenger
  >
> {
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkEnablementControllerMessenger(baseMessenger),
    initMessenger: getNetworkEnablementControllerInitMessenger(baseMessenger),
  };

  // @ts-expect-error: Partial mock.
  requestMock.getMessengerClient.mockImplementation((controllerName) => {
    if (controllerName === 'MultichainNetworkController') {
      return {
        state: {
          multichainNetworkConfigurationsByChainId: {
            [SolScope.Mainnet]: {},
            [BtcScope.Mainnet]: {},
          },
        },
      };
    }

    if (controllerName === 'NetworkController') {
      return {
        state: {
          networkConfigurationsByChainId: {
            [CHAIN_IDS.MAINNET]: {},
            [CHAIN_IDS.POLYGON]: {},
            [CHAIN_IDS.SEPOLIA]: {},
            [CHAIN_IDS.LOCALHOST]: {},
          },
        },
      };
    }

    throw new Error(`Unexpected messengerClient name: ${controllerName}`);
  });

  return requestMock;
}

describe('NetworkEnablementControllerInit', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('initializes the controller', () => {
    const { messengerClient } =
      NetworkEnablementControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(NetworkEnablementController);
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
    const { messengerClient } = NetworkEnablementControllerInit(request);

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
    const { messengerClient } = NetworkEnablementControllerInit(request);

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
    const { messengerClient } = NetworkEnablementControllerInit(request);

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
    const { messengerClient } = NetworkEnablementControllerInit(request);

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
    const { messengerClient } = NetworkEnablementControllerInit(request);

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
        NetworkEnablementControllerInit(getInitRequestMock());

      const controllerMock = jest.mocked(NetworkEnablementController);
      expect(controllerMock).toHaveBeenLastCalledWith({
        messenger: expect.any(Object),
        state: {
          enabledNetworkMap: {
            [KnownCaipNamespace.Eip155]: {
              [CHAIN_IDS.MAINNET]: false,
              [CHAIN_IDS.POLYGON]: false,
              [CHAIN_IDS.SEPOLIA]: false,
              [CHAIN_IDS.LOCALHOST]: false,
            },
            [KnownCaipNamespace.Solana]: {
              [SolScope.Mainnet]: false,
            },
            [KnownCaipNamespace.Bip122]: {
              [BtcScope.Mainnet]: false,
            },
          },
          nativeAssetIdentifiers: {},
        },
      });
      expect(messengerClient.enableAllPopularNetworks).toHaveBeenCalledTimes(1);
    });
  });

  it('initialises the controller with only localhost enabled in test builds', () => {
    process.env.IN_TEST = 'true';

    const { messengerClient } =
      NetworkEnablementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.LOCALHOST]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
        nativeAssetIdentifiers: {},
      },
    });
    expect(messengerClient.enableAllPopularNetworks).not.toHaveBeenCalled();
  });

  it('keeps localhost selected when a registry network exists before initialization', () => {
    process.env.IN_TEST = 'true';
    const request = getInitRequestMock();
    // @ts-expect-error: Partial mock.
    request.getMessengerClient.mockImplementation((controllerName) => {
      if (controllerName === 'MultichainNetworkController') {
        return {
          state: {
            multichainNetworkConfigurationsByChainId: {
              [SolScope.Mainnet]: {},
              [BtcScope.Mainnet]: {},
            },
          },
        };
      }

      if (controllerName === 'NetworkController') {
        return {
          state: {
            networkConfigurationsByChainId: {
              [CHAIN_IDS.MAINNET]: {},
              [CHAIN_IDS.POLYGON]: {},
              [CHAIN_IDS.SEPOLIA]: {},
              [CHAIN_IDS.LOCALHOST]: {},
              [CHAIN_IDS.ARC]: {},
            },
          },
        };
      }

      throw new Error(`Unexpected messengerClient name: ${controllerName}`);
    });

    NetworkEnablementControllerInit(request);

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenLastCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.LOCALHOST]: true,
            [CHAIN_IDS.ARC]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
        nativeAssetIdentifiers: {},
      },
    });
  });

  it('preserves a single filter when Config Registry auto-adds Arc', async () => {
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

    const { messengerClient } = NetworkEnablementControllerInit(request);
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
    request.controllerMessenger.publish(
      'NetworkEnablementController:stateChange',
      {
        enabledNetworkMap: messengerClient.state.enabledNetworkMap,
      } as never,
      [] as never,
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

    const { messengerClient } = NetworkEnablementControllerInit(request);
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
    request.controllerMessenger.publish(
      'NetworkEnablementController:stateChange',
      {
        enabledNetworkMap: messengerClient.state.enabledNetworkMap,
      } as never,
      [] as never,
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

    const { messengerClient } = NetworkEnablementControllerInit(request);
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
});
