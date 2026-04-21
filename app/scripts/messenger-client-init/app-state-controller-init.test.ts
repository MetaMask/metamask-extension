import {
  AppStateController,
  AppStateControllerMessenger,
} from '../controllers/app-state-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getAppStateControllerMessenger } from './messengers';
import { AppStateControllerInit } from './app-state-controller-init';

jest.mock('../controllers/app-state-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AppStateControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAppStateControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AppStateControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = AppStateControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AppStateController);
  });

  it('passes the proper arguments to the controller', () => {
    AppStateControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AppStateController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      extension: expect.any(Object),
      onInactiveTimeout: expect.any(Function),
    });
  });
});
