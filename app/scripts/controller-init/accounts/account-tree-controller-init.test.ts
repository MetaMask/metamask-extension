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
import {
  AccountTreeControllerInit,
  migratePinnedAndHiddenStateToAccountTreeController,
} from './account-tree-controller-init';

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

describe('migratePinnedAndHiddenStateToAccountTreeController', () => {
  const accountId1 = 'account-1';
  const accountId2 = 'account-2';
  const accountId3 = 'account-3';

  function buildControllerMock(
    groupsByWallet: Record<string, { id: string; accounts: string[] }>[],
  ) {
    const getAccountWalletObjects = jest.fn().mockReturnValue(
      groupsByWallet.map((groups) => ({
        // Only the groups field is used by the migration, the rest can be omitted
        groups,
      })),
    );

    const setAccountGroupPinned = jest.fn();
    const setAccountGroupHidden = jest.fn();

    const controller = {
      getAccountWalletObjects,
      setAccountGroupPinned,
      setAccountGroupHidden,
    } as unknown as AccountTreeController;

    return { controller, setAccountGroupPinned, setAccountGroupHidden };
  }

  it('pins and hides matching account groups based on addresses', () => {
    const { controller, setAccountGroupPinned, setAccountGroupHidden } =
      buildControllerMock([
        {
          'group-1': { id: 'group-1', accounts: [accountId1, accountId2] },
          'group-2': { id: 'group-2', accounts: [accountId3] },
        },
      ]);

    migratePinnedAndHiddenStateToAccountTreeController(
      controller,
      [accountId1],
      [accountId3],
    );

    expect(setAccountGroupPinned).toHaveBeenCalledTimes(1);
    expect(setAccountGroupPinned).toHaveBeenCalledWith('group-1', true);

    expect(setAccountGroupHidden).toHaveBeenCalledTimes(1);
    expect(setAccountGroupHidden).toHaveBeenCalledWith('group-2', true);
  });

  it('does nothing when no addresses match any group', () => {
    const { controller, setAccountGroupPinned, setAccountGroupHidden } =
      buildControllerMock([
        {
          'group-1': { id: 'group-1', accounts: [accountId3] },
        },
      ]);

    migratePinnedAndHiddenStateToAccountTreeController(
      controller,
      [accountId1],
      [accountId2],
    );

    expect(setAccountGroupPinned).not.toHaveBeenCalled();
    expect(setAccountGroupHidden).not.toHaveBeenCalled();
  });

  it('can pin and hide the same group when both lists match', () => {
    const { controller, setAccountGroupPinned, setAccountGroupHidden } =
      buildControllerMock([
        {
          'group-9': { id: 'group-9', accounts: [accountId3] },
        },
      ]);

    migratePinnedAndHiddenStateToAccountTreeController(
      controller,
      [accountId3],
      [accountId3],
    );

    expect(setAccountGroupPinned).toHaveBeenCalledWith('group-9', true);
    expect(setAccountGroupHidden).toHaveBeenCalledWith('group-9', true);
  });
});
