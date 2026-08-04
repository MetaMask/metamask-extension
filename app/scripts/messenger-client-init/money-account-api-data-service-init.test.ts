import {
  Env,
  MoneyAccountApiDataService,
  type MoneyAccountApiDataServiceMessenger,
} from '@metamask/money-account-api-data-service';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMoneyAccountApiDataServiceMessenger } from './messengers';
import { MoneyAccountApiDataServiceInit } from './money-account-api-data-service-init';

jest.mock('@metamask/money-account-api-data-service');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountApiDataServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountApiDataServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('MoneyAccountApiDataServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service', () => {
    const { messengerClient } =
      MoneyAccountApiDataServiceInit(getInitRequestMock());

    expect(messengerClient).toBeInstanceOf(MoneyAccountApiDataService);
  });

  it('passes the service messenger and the production environment', () => {
    MoneyAccountApiDataServiceInit(getInitRequestMock());

    expect(jest.mocked(MoneyAccountApiDataService)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      env: Env.PRD,
    });
  });

  it('returns null for persistedStateKey', () => {
    const result = MoneyAccountApiDataServiceInit(getInitRequestMock());

    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = MoneyAccountApiDataServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
  });
});
