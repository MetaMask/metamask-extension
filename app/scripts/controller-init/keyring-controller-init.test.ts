import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { NetworkControllerGetSelectedNetworkClientAction } from '@metamask/network-controller';
import { KeyringController } from '@metamask/keyring-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getKeyringControllerMessenger,
  KeyringControllerMessenger,
  getKeyringControllerInitMessenger,
  KeyringControllerInitMessenger,
} from './messengers';
import { KeyringControllerInit } from './keyring-controller-init';

jest.mock('@metamask/keyring-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    KeyringControllerMessenger,
    KeyringControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    NetworkControllerGetSelectedNetworkClientAction | ActionConstraint,
    never
  >();

  baseMessenger.registerActionHandler(
    'NetworkController:getSelectedNetworkClient',
    () => ({
      // @ts-expect-error: Partial mock.
      provider: {},

      // @ts-expect-error: Partial mock.
      blockTracker: {},
    }),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getKeyringControllerMessenger(baseMessenger),
    initMessenger: getKeyringControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('KeyringControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = KeyringControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(KeyringController);
  });

  it('passes the proper arguments to the controller', () => {
    KeyringControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(KeyringController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      cacheEncryptionKey: true,
      encryptor: expect.any(Object),
      keyringBuilders: expect.any(Array),
    });
  });
});
