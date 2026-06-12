import {
  AccountOrderController,
  AccountOrderControllerMessenger,
} from '../controllers/account-order';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getAccountOrderControllerMessenger } from './messengers';
import { AccountOrderControllerInit } from './account-order-controller-init';

jest.mock('../controllers/account-order');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<AccountOrderControllerMessenger>
> {
  const baseMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAccountOrderControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('AccountOrderControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      AccountOrderControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(AccountOrderController);
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
