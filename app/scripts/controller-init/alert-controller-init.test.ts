import { Messenger } from '@metamask/base-controller';
import { AlertController } from '../controllers/alert-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAlertControllerMessenger,
  AlertControllerMessenger,
} from './messengers';
import { AlertControllerInit } from './alert-controller-init';

jest.mock('../controllers/alert-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AlertControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAlertControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AlertControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AlertControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AlertController);
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
