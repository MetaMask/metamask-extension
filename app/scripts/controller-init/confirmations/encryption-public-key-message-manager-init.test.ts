import { Messenger } from '@metamask/base-controller';
import { EncryptionPublicKeyManager } from '@metamask/message-manager';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getEncryptionPublicKeyManagerMessenger,
  EncryptionPublicKeyManagerMessenger,
} from '../messengers';
import { EncryptionPublicKeyManagerInit } from './encryption-public-key-message-manager-init';

jest.mock('@metamask/message-manager');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<EncryptionPublicKeyManagerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getEncryptionPublicKeyManagerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('EncryptionPublicKeyManagerInit', () => {
  it('initializes the controller', () => {
    const { controller } = EncryptionPublicKeyManagerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(EncryptionPublicKeyManager);
  });

  it('passes the proper arguments to the controller', () => {
    EncryptionPublicKeyManagerInit(getInitRequestMock());

    const controllerMock = jest.mocked(EncryptionPublicKeyManager);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      additionalFinishStatuses: ['received'],
    });
  });
});
