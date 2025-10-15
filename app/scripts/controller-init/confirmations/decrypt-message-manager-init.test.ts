import { Messenger } from '@metamask/base-controller';
import { DecryptMessageManager } from '@metamask/message-manager';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getDecryptMessageManagerMessenger,
  DecryptMessageManagerMessenger,
} from '../messengers';
import { DecryptMessageManagerInit } from './decrypt-message-manager-init';

jest.mock('@metamask/message-manager');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<DecryptMessageManagerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDecryptMessageManagerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('DecryptMessageManagerInit', () => {
  it('initializes the controller', () => {
    const { controller } = DecryptMessageManagerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(DecryptMessageManager);
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
