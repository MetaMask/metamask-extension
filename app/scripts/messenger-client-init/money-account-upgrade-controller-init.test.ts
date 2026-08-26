import {
  MoneyAccountUpgradeController,
  type MoneyAccountUpgradeControllerMessenger,
} from '@metamask/money-account-upgrade-controller';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMoneyAccountUpgradeControllerMessenger } from './messengers';
import { MoneyAccountUpgradeControllerInit } from './money-account-upgrade-controller-init';

jest.mock('@metamask/money-account-upgrade-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountUpgradeControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger:
      getMoneyAccountUpgradeControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('MoneyAccountUpgradeControllerInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the controller', () => {
    const { messengerClient } = MoneyAccountUpgradeControllerInit(
      getInitRequestMock(),
    );

    expect(messengerClient).toBeInstanceOf(MoneyAccountUpgradeController);
  });

  it('restores the persisted state', () => {
    const request = getInitRequestMock();
    const persistedState = { upgradedAccounts: {} };
    request.persistedState = {
      MoneyAccountUpgradeController: persistedState,
    };

    MoneyAccountUpgradeControllerInit(request);

    expect(jest.mocked(MoneyAccountUpgradeController)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: persistedState,
    });
  });

  it('persists state under the default key', () => {
    const result = MoneyAccountUpgradeControllerInit(getInitRequestMock());

    expect(result.persistedStateKey).toBeUndefined();
    expect(result.memStateKey).toBeUndefined();
  });
});
