import {
  AccountTreeController,
  AccountTreeControllerMessenger,
} from '@metamask/account-tree-controller';
import { TraceName, trace } from '../../../../shared/lib/trace';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getAccountTreeControllerMessenger,
  getAccountTreeControllerInitMessenger,
  AccountTreeControllerInitMessenger,
} from '../messengers/accounts';
import { getRootMessenger } from '../../lib/messenger';
import { AccountTreeControllerInit } from './account-tree-controller-init';

jest.mock('@metamask/account-tree-controller');
jest.mock('../../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../../shared/lib/trace'),
  trace: jest.fn(),
}));

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    AccountTreeControllerMessenger,
    AccountTreeControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

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
  const traceMock = jest.mocked(trace);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      AccountTreeControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(AccountTreeController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AccountTreeControllerInit(requestMock);

    expect(accountTreeControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: requestMock.controllerMessenger,
        state: requestMock.persistedState.AccountTreeController,
        config: expect.objectContaining({
          trace: expect.any(Function),
          backupAndSync: expect.objectContaining({
            onBackupAndSyncEvent: expect.any(Function),
          }),
        }),
      }),
    );
  });

  it('roots multichain account sync entry traces', () => {
    const requestMock = buildInitRequestMock();
    AccountTreeControllerInit(requestMock);

    const traceFn =
      accountTreeControllerClassMock.mock.calls[0][0].config?.trace;
    const callback = jest.fn();

    traceFn?.({ name: TraceName.AccountSyncFull } as never, callback);

    expect(traceMock).toHaveBeenCalledWith(
      {
        name: TraceName.AccountSyncFull,
        root: true,
      },
      callback,
    );
  });
});
