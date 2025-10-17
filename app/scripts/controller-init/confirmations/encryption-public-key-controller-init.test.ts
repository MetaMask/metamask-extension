import { Messenger } from '@metamask/base-controller';
import EncryptionPublicKeyController from '../../controllers/encryption-public-key';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getEncryptionPublicKeyControllerMessenger,
  EncryptionPublicKeyControllerMessenger,
  getEncryptionPublicKeyControllerInitMessenger,
  EncryptionPublicKeyControllerInitMessenger,
} from '../messengers';
import { EncryptionPublicKeyControllerInit } from './encryption-public-key-controller-init';

jest.mock('../../controllers/encryption-public-key');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    EncryptionPublicKeyControllerMessenger,
    EncryptionPublicKeyControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

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
    const { controller } =
      EncryptionPublicKeyControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(EncryptionPublicKeyController);
  });

  it('passes the proper arguments to the controller', () => {
    const manager = {};
    const request = getInitRequestMock();

    // @ts-expect-error: Partial mock.
    request.getController.mockReturnValue(manager);

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
