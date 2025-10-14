import { Messenger } from '@metamask/base-controller';
import { NetworkEnablementController } from '@metamask/network-enablement-controller';
import { BtcScope, SolAccountType, SolScope } from '@metamask/keyring-api';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getNetworkEnablementControllerInitMessenger,
  getNetworkEnablementControllerMessenger,
  NetworkEnablementControllerInitMessenger,
  NetworkEnablementControllerMessenger,
} from '../messengers/assets';
import { NetworkEnablementControllerInit } from './network-enablement-controller-init';

jest.mock('@metamask/network-enablement-controller');

function getInitRequestMock(
  baseMessenger = new Messenger<never, never>(),
): jest.Mocked<
  ControllerInitRequest<
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
  requestMock.getController.mockImplementation((controllerName) => {
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

    throw new Error(`Unexpected controller name: ${controllerName}`);
  });

  return requestMock;
}

describe('NetworkEnablementControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } =
      NetworkEnablementControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(NetworkEnablementController);
  });

  it('enables the Solana network when `AccountsController:selectedAccountChange` is emitted', () => {
    const messenger = new Messenger<
      never,
      AccountsControllerSelectedAccountChangeEvent
    >();
    const request = getInitRequestMock(messenger);
    const { controller } = NetworkEnablementControllerInit(request);

    expect(controller.enableNetworkInNamespace).not.toHaveBeenCalled();

    // @ts-expect-error: Partial mock.
    messenger.publish('AccountsController:selectedAccountChange', {
      type: SolAccountType.DataAccount,
    });

    expect(controller.enableNetworkInNamespace).toHaveBeenCalledWith(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      'solana',
    );
  });

  it('enables the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted, the current chain ID is Solana mainnet, and there are no Solana accounts', () => {
    const messenger = new Messenger<
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >();

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { controller } = NetworkEnablementControllerInit(request);

    controller.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
      },
    };

    expect(controller.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(controller.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('enables the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted, the current chain ID is Bitcoin mainnet, and there are no Bitcoin accounts', () => {
    const messenger = new Messenger<
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >();

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { controller } = NetworkEnablementControllerInit(request);

    controller.state = {
      enabledNetworkMap: {
        bitcoin: { [BtcScope.Mainnet]: true },
      },
    };

    expect(controller.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(controller.enableNetwork).toHaveBeenCalledWith('0x1');
  });

  it('does not enable the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted and there are accounts', () => {
    const messenger = new Messenger<
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >();

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      // @ts-expect-error: Partial mock.
      () => [{ type: SolAccountType.DataAccount }],
    );

    const request = getInitRequestMock(messenger);
    const { controller } = NetworkEnablementControllerInit(request);

    controller.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
      },
    };

    expect(controller.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(controller.enableNetwork).not.toHaveBeenCalled();
  });

  it('does not enable the Ethereum network when `AccountTreeController:selectedAccountGroupChange` is emitted and multiple networks are enabled', () => {
    const messenger = new Messenger<
      AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
      AccountTreeControllerSelectedAccountGroupChangeEvent
    >();

    messenger.registerActionHandler(
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      () => [],
    );

    const request = getInitRequestMock(messenger);
    const { controller } = NetworkEnablementControllerInit(request);

    controller.state = {
      enabledNetworkMap: {
        solana: { [SolScope.Mainnet]: true },
        bitcoin: { [BtcScope.Mainnet]: true },
      },
    };

    expect(controller.enableNetwork).not.toHaveBeenCalled();

    messenger.publish(
      'AccountTreeController:selectedAccountGroupChange',
      '',
      '',
    );

    expect(controller.enableNetwork).not.toHaveBeenCalled();
  });

  it('initialises the controller with the correct networks for prod environment', () => {
    process.env.METAMASK_DEBUG = '';
    process.env.METAMASK_ENVIRONMENT = 'production';
    process.env.IN_TEST = '';

    NetworkEnablementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: true,
          },
        },
      },
    });
  });

  it('initialises the controller with the correct networks for IN_TEST environment', () => {
    process.env.IN_TEST = 'true';

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
      },
    });
  });

  it('initialises the controller with the correct networks for DEBUG environment', () => {
    process.env.METAMASK_DEBUG = 'true';
    process.env.METAMASK_ENVIRONMENT = 'production';
    process.env.IN_TEST = '';

    NetworkEnablementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
      },
    });
  });

  it('initialises the controller with the correct networks for test environment', () => {
    process.env.METAMASK_DEBUG = '';
    process.env.METAMASK_ENVIRONMENT = 'test';
    process.env.IN_TEST = '';

    NetworkEnablementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
      },
    });
  });
});
