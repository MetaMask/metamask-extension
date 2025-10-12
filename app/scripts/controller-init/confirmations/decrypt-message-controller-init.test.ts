import { Messenger } from '@metamask/base-controller';
import DecryptMessageController from '../../controllers/decrypt-message';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getDecryptMessageControllerMessenger,
  DecryptMessageControllerMessenger,
  getDecryptMessageControllerInitMessenger,
} from '../messengers';
import { DecryptMessageControllerInitMessenger } from '../messengers/decrypt-message-controller-messenger';
import { DecryptMessageControllerInit } from './decrypt-message-controller-init';

jest.mock('../../controllers/decrypt-message');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    DecryptMessageControllerMessenger,
    DecryptMessageControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDecryptMessageControllerMessenger(baseMessenger),
    initMessenger: getDecryptMessageControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('DecryptMessageControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = DecryptMessageControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(DecryptMessageController);
  });

  it('passes the proper arguments to the controller', () => {
    const manager = {};
    const request = getInitRequestMock();

    // @ts-expect-error: Partial mock.
    request.getController.mockReturnValue(manager);

    DecryptMessageControllerInit(request);

    const controllerMock = jest.mocked(DecryptMessageController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      getState: expect.any(Function),
      metricsEvent: expect.any(Function),
      manager,
    });
  });
});
