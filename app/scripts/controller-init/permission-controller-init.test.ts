import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { PermissionController } from '@metamask/permission-controller';
import { getRootMessenger } from '../lib/messenger';
import type {
  ControllerByName,
  ControllerInitRequest,
  ControllerName,
} from './types';
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
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPermissionControllerMessenger(baseMessenger),
    initMessenger: getPermissionControllerInitMessenger(baseMessenger),
  };

  requestMock.getController.mockImplementation((name: ControllerName) => {
    if (name === 'ApprovalController') {
      return {
        addAndShowApprovalRequest: jest.fn(),
      } as unknown as ControllerByName['ApprovalController'];
    }

    if (name === 'KeyringController') {
      return {
        addNewKeyring: jest.fn(),
      } as unknown as ControllerByName['KeyringController'];
    }

    throw new Error(`Controller "${String(name)}" not found.`);
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

  it('passes persisted PermissionController state when present', () => {
    jest.mocked(PermissionController).mockClear();
    const request = getInitRequestMock();
    const permissionState = { subjects: {} };
    request.persistedState = {
      PermissionController: permissionState,
    };

    PermissionControllerInit(request);

    const constructorArgs = jest
      .mocked(PermissionController)
      .mock.calls.at(-1)?.[0];
    expect(constructorArgs?.state).toBe(permissionState);
  });

  it('includes CAIP-25 caveat specification in caveatSpecifications passed to PermissionController', () => {
    jest.mocked(PermissionController).mockClear();
    PermissionControllerInit(getInitRequestMock());
    const caveatSpecifications = jest.mocked(PermissionController).mock
      .calls[0][0].caveatSpecifications as Record<string, unknown>;
    expect(caveatSpecifications).toHaveProperty(Caip25CaveatType);
  });
});
