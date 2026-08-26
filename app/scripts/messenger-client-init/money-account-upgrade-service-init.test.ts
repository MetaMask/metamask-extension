import { MoneyAccountUpgradeController } from '@metamask/money-account-upgrade-controller';
import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from '../lib/money/money-account-upgrade-service';
import { getRootMessenger } from '../lib/messenger';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getMoneyAccountUpgradeServiceMessenger } from './messengers';
import { MoneyAccountUpgradeServiceInit } from './money-account-upgrade-service-init';

jest.mock('../lib/money/money-account-upgrade-service');
jest.mock('@metamask/money-account-upgrade-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountUpgradeServiceMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountUpgradeServiceMessenger(baseMessenger),
    initMessenger: undefined,
  };
}

describe('MoneyAccountUpgradeServiceInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes the service with the upgrade controller instance', () => {
    const request = getInitRequestMock();
    const upgradeController = new MoneyAccountUpgradeController(
      {} as never,
    );
    request.getMessengerClient.mockReturnValue(upgradeController);

    const { messengerClient } = MoneyAccountUpgradeServiceInit(request);

    expect(messengerClient).toBeInstanceOf(MoneyAccountUpgradeService);
    expect(request.getMessengerClient).toHaveBeenCalledWith(
      'MoneyAccountUpgradeController',
    );
    expect(jest.mocked(MoneyAccountUpgradeService)).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      upgradeController,
    });
  });

  it('returns null for persistedStateKey', () => {
    const result = MoneyAccountUpgradeServiceInit(getInitRequestMock());

    expect(result.persistedStateKey).toBeNull();
  });

  it('returns null for memStateKey', () => {
    const result = MoneyAccountUpgradeServiceInit(getInitRequestMock());

    expect(result.memStateKey).toBeNull();
  });
});
