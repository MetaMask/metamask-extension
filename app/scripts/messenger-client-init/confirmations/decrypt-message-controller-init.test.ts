import {
  DecryptMessageController,
  DecryptMessageControllerMessenger,
} from '../../controllers/decrypt-message';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getDecryptMessageControllerMessenger,
  getDecryptMessageControllerInitMessenger,
} from '../messengers';
import { getRootMessenger } from '../../lib/messenger';
import { DecryptMessageControllerInitMessenger } from '../messengers/decrypt-message-controller-messenger';
import { DecryptMessageControllerInit } from './decrypt-message-controller-init';

jest.mock('../../controllers/decrypt-message');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    DecryptMessageControllerMessenger,
    DecryptMessageControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getDecryptMessageControllerMessenger(baseMessenger),
    initMessenger: getDecryptMessageControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('DecryptMessageControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      DecryptMessageControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(DecryptMessageController);
  });

  it('passes the proper arguments to the controller', () => {
    const manager = {};
    const request = getInitRequestMock();

    // @ts-expect-error: Partial mock.
    request.getMessengerClient.mockReturnValue(manager);

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
