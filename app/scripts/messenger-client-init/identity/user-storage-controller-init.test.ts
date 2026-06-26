import { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import { Env } from '@metamask/profile-sync-controller/sdk';
import { TraceName, trace } from '../../../../shared/lib/trace';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getUserStorageControllerMessenger,
  UserStorageControllerMessenger,
} from '../messengers/identity';
import {
  getUserStorageControllerInitMessenger,
  UserStorageControllerInitMessenger,
} from '../messengers/identity/user-storage-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { UserStorageControllerInit } from './user-storage-controller-init';

jest.mock('@metamask/profile-sync-controller/user-storage');
jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  trace: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment', () => ({
  isProduction: () => false,
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    UserStorageControllerMessenger,
    UserStorageControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getUserStorageControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getUserStorageControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('UserStorageControllerInit', () => {
  const UserStorageControllerClassMock = jest.mocked(UserStorageController);
  const traceMock = jest.mocked(trace);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      UserStorageControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(UserStorageController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    UserStorageControllerInit(requestMock);

    expect(UserStorageControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.UserStorageController,
      trace: expect.any(Function),
      config: {
        contactSyncing: {
          onContactUpdated: expect.any(Function),
          onContactDeleted: expect.any(Function),
          onContactSyncErroneousSituation: expect.any(Function),
        },
        env: Env.PRD,
      },
    });
  });

  it('roots contact sync entry traces only', () => {
    const requestMock = buildInitRequestMock();
    UserStorageControllerInit(requestMock);

    const traceFn = UserStorageControllerClassMock.mock.calls[0][0].trace;
    const callback = jest.fn();

    traceFn?.({ name: TraceName.ContactSyncFull } as never, callback);
    traceFn?.({ name: TraceName.ContactSyncSaveBatch } as never, callback);

    expect(traceMock).toHaveBeenNthCalledWith(
      1,
      {
        name: TraceName.ContactSyncFull,
        root: true,
      },
      callback,
    );
    expect(traceMock).toHaveBeenNthCalledWith(
      2,
      {
        name: TraceName.ContactSyncSaveBatch,
      },
      callback,
    );
  });
});
