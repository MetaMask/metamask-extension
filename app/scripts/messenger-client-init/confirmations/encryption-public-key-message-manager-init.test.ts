import { EncryptionPublicKeyManager } from '@metamask/message-manager';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getEncryptionPublicKeyManagerMessenger,
  EncryptionPublicKeyManagerMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { EncryptionPublicKeyManagerInit } from './encryption-public-key-message-manager-init';

jest.mock('@metamask/message-manager');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<EncryptionPublicKeyManagerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getEncryptionPublicKeyManagerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('EncryptionPublicKeyManagerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      EncryptionPublicKeyManagerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(EncryptionPublicKeyManager);
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
