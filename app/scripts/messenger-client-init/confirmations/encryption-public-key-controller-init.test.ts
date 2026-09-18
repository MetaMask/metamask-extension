import {
  EncryptionPublicKeyController,
  EncryptionPublicKeyControllerMessenger,
} from '../../controllers/encryption-public-key';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getEncryptionPublicKeyControllerMessenger,
  getEncryptionPublicKeyControllerInitMessenger,
  EncryptionPublicKeyControllerInitMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { EncryptionPublicKeyControllerInit } from './encryption-public-key-controller-init';

jest.mock('../../controllers/encryption-public-key');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    EncryptionPublicKeyControllerMessenger,
    EncryptionPublicKeyControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getEncryptionPublicKeyControllerMessenger(baseMessenger),
    initMessenger: getEncryptionPublicKeyControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('EncryptionPublicKeyControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      EncryptionPublicKeyControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(EncryptionPublicKeyController);
  });

  it('passes the proper arguments to the controller', () => {
    const manager = {};
    const request = getInitRequestMock();

    // @ts-expect-error: Partial mock.
    request.getMessengerClient.mockReturnValue(manager);

    EncryptionPublicKeyControllerInit(request);

    const controllerMock = jest.mocked(EncryptionPublicKeyController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      getAccountKeyringType: expect.any(Function),
      getEncryptionPublicKey: expect.any(Function),
      getState: expect.any(Function),
      metricsEvent: expect.any(Function),
      manager,
    });
  });
});
