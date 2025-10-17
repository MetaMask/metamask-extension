import { Messenger } from '@metamask/base-controller';
import { AccountOrderController } from '../controllers/account-order';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getAccountOrderControllerMessenger,
  AccountOrderControllerMessenger,
} from './messengers';
import { AccountOrderControllerInit } from './account-order-controller-init';

jest.mock('../controllers/account-order');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AccountOrderControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountOrderControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AccountOrderControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = AccountOrderControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(AccountOrderController);
  });

  it('passes the proper arguments to the controller', () => {
    AccountOrderControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(AccountOrderController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
    });
  });
});
