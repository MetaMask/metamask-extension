import { Messenger } from '@metamask/base-controller';
import { NetworkEnablementController } from '@metamask/network-enablement-controller';
import { SolAccountType } from '@metamask/keyring-api';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
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
          multichainNetworkConfigurationsByChainId: {},
        },
      };
    }

    if (controllerName === 'NetworkController') {
      return {
        state: {
          networkConfigurationsByChainId: {},
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

  it('passes the proper arguments to the controller', () => {
    NetworkEnablementControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(NetworkEnablementController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        enabledNetworkMap: {
          bitcoin: {},
          eip155: {},
          solana: {},
        },
      },
    });
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
});
