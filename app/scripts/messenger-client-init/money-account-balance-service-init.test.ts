import {
  MoneyAccountBalanceService,
  type MoneyAccountBalanceServiceMessenger,
} from '@metamask/money-account-balance-service';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMoneyAccountBalanceServiceMessenger } from './messengers';
import { MoneyAccountBalanceServiceInit } from './money-account-balance-service-init';

jest.mock('@metamask/money-account-balance-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountBalanceServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountBalanceServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('MoneyAccountBalanceServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { messengerClient } =
      MoneyAccountBalanceServiceInit(getInitRequestMock());

    expect(messengerClient).toBeInstanceOf(MoneyAccountBalanceService);
  });

  it('passes the service messenger', () => {
    MoneyAccountBalanceServiceInit(getInitRequestMock());

    expect(jest.mocked(MoneyAccountBalanceService)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
    });
  });

  it('calls init on the service', () => {
    const { messengerClient } =
      MoneyAccountBalanceServiceInit(getInitRequestMock());

    expect(jest.mocked(messengerClient).init).toHaveBeenCalledTimes(1);
  });

  it('returns null for persistedStateKey', () => {
    const result = MoneyAccountBalanceServiceInit(getInitRequestMock());

    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = MoneyAccountBalanceServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
  });
});
