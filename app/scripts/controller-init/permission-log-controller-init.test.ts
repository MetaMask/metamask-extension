import { Messenger } from '@metamask/base-controller';
import { PermissionLogController } from '@metamask/permission-log-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPermissionLogControllerMessenger,
  PermissionLogControllerMessenger,
} from './messengers';
import { PermissionLogControllerInit } from './permission-log-controller-init';

jest.mock('@metamask/permission-log-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<PermissionLogControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPermissionLogControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('PermissionLogControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = PermissionLogControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(PermissionLogController);
  });

  it('passes the proper arguments to the controller', () => {
    PermissionLogControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(PermissionLogController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      restrictedMethods: expect.any(Set),
    });
  });
});
