import { AccountTreeController } from '@metamask/account-tree-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getAccountTreeControllerMessenger,
  AccountTreeControllerMessenger,
} from '../messengers/accounts';
import { AccountTreeControllerInit } from './account-tree-controller-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AccountTreeControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountTreeControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('AccountTreeControllerInit', () => {
  const accountWalletControllerClassMock = jest.mocked(AccountTreeController);

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

    expect(accountWalletControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.AccountTreeController,
    });
  });
});
