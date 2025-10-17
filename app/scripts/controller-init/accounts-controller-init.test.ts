import { Messenger } from '@metamask/base-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAccountsControllerMessenger,
  AccountsControllerMessenger,
} from './messengers';
import { AccountsControllerInit } from './accounts-controller-init';

jest.mock('@metamask/accounts-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AccountsControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AccountsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountsController);
  });

  it('passes the proper arguments to the controller', () => {
    AccountsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
