import { DecryptMessageManager } from '@metamask/message-manager';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getDecryptMessageManagerMessenger,
  DecryptMessageManagerMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { DecryptMessageManagerInit } from './decrypt-message-manager-init';

jest.mock('@metamask/message-manager');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<DecryptMessageManagerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDecryptMessageManagerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('DecryptMessageManagerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = DecryptMessageManagerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(DecryptMessageManager);
  });

  it('passes the proper arguments to the controller', () => {
    DecryptMessageManagerInit(getInitRequestMock());

    const controllerMock = jest.mocked(DecryptMessageManager);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      additionalFinishStatuses: ['decrypted'],
    });
  });
});
