import {
  AlertController,
  AlertControllerMessenger,
} from '../controllers/alert-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getAlertControllerMessenger } from './messengers';
import { AlertControllerInit } from './alert-controller-init';

jest.mock('../controllers/alert-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AlertControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAlertControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AlertControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = AlertControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AlertController);
  });

  it('passes the proper arguments to the controller', () => {
    AlertControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AlertController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
