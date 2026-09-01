import { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import { Env } from '@metamask/profile-sync-controller/sdk';
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
});
