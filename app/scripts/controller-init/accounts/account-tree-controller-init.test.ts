import { AccountTreeController } from '@metamask/account-tree-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getAccountTreeControllerMessenger,
  getAccountTreeControllerInitMessenger,
  AccountTreeControllerMessenger,
  AccountTreeControllerInitMessenger,
} from '../messengers/accounts';
import { AccountTreeControllerInit } from './account-tree-controller-init';

jest.mock('@metamask/account-tree-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    AccountTreeControllerMessenger,
    AccountTreeControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountTreeControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getAccountTreeControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('AccountTreeControllerInit', () => {
  const accountTreeControllerClassMock = jest.mocked(AccountTreeController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(AccountTreeControllerInit(requestMock).controller).toBeInstanceOf(
      AccountTreeController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AccountTreeControllerInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.AccountTreeController,
      config: {
        trace: expect.any(Function),
        backupAndSync: {
          onBackupAndSyncEvent: expect.any(Function),
        },
      },
    });
  });
});
