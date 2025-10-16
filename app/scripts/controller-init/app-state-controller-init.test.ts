import { Messenger } from '@metamask/base-controller';
import { AppStateController } from '../controllers/app-state-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAppStateControllerMessenger,
  AppStateControllerMessenger,
} from './messengers';
import { AppStateControllerInit } from './app-state-controller-init';

jest.mock('../controllers/app-state-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AppStateControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAppStateControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AppStateControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AppStateControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AppStateController);
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
