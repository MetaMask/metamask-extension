import { Controller as UserStorageController } from '@metamask/profile-sync-controller/user-storage';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getUserStorageControllerMessenger,
  UserStorageControllerMessenger,
} from '../messengers/identity';
import {
  getUserStorageControllerInitMessenger,
  UserStorageControllerInitMessenger,
} from '../messengers/identity/user-storage-controller-messenger';
import { UserStorageControllerInit } from './user-storage-controller-init';

jest.mock('@metamask/profile-sync-controller/user-storage');

jest.mock('../../../../shared/modules/environment', () => ({
  isProduction: () => false,
}));

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    UserStorageControllerMessenger,
    UserStorageControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

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
    expect(UserStorageControllerInit(requestMock).controller).toBeInstanceOf(
      UserStorageController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    UserStorageControllerInit(requestMock);

    expect(UserStorageControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.UserStorageController,
      trace: expect.any(Function),
      config: {
        accountSyncing: {
          maxNumberOfAccountsToAdd: 100,
          onAccountAdded: expect.any(Function),
          onAccountNameUpdated: expect.any(Function),
          onAccountSyncErroneousSituation: expect.any(Function),
        },
        contactSyncing: {
          onContactUpdated: expect.any(Function),
          onContactDeleted: expect.any(Function),
          onContactSyncErroneousSituation: expect.any(Function),
        },
      },
    });
  });
});
