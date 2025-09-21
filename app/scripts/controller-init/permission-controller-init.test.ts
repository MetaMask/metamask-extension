import { Messenger } from '@metamask/base-controller';
import { PermissionController } from '@metamask/permission-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPermissionControllerInitMessenger,
  getPermissionControllerMessenger,
  PermissionControllerInitMessenger,
  PermissionControllerMessenger,
} from './messengers';
import { PermissionControllerInit } from './permission-controller-init';

jest.mock('@metamask/permission-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    PermissionControllerMessenger,
    PermissionControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPermissionControllerMessenger(baseMessenger),
    initMessenger: getPermissionControllerInitMessenger(baseMessenger),
  };

  // @ts-expect-error: Partial implementation.
  requestMock.getController.mockImplementation((controllerName: string) => {
    if (controllerName === 'ApprovalController') {
      return {
        addAndShowApprovalRequest: jest.fn(),
      };
    }

    if (controllerName === 'KeyringController') {
      return {
        addNewKeyring: jest.fn(),
      };
    }

    throw new Error(`Controller "${controllerName}" not found.`);
  });

  return requestMock;
}

describe('PermissionControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = PermissionControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(PermissionController);
  });

  it('passes the proper arguments to the controller', () => {
    PermissionControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(PermissionController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      caveatSpecifications: expect.any(Object),
      permissionSpecifications: expect.any(Object),
      unrestrictedMethods: expect.any(Array),
    });
  });
});
