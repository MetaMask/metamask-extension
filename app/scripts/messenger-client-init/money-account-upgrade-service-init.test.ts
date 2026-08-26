import type { MoneyAccountUpgradeController } from '@metamask/money-account-upgrade-controller';
import { getRootMessenger } from '../lib/messenger';
import {
  MoneyAccountUpgradeService,
  type MoneyAccountUpgradeServiceMessenger,
} from '../lib/money/money-account-upgrade-service';
import type { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { MoneyAccountUpgradeServiceInit } from './money-account-upgrade-service-init';
import { getMoneyAccountUpgradeServiceMessenger } from './messengers/money-account-upgrade-service-messenger';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountUpgradeServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();
  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountUpgradeServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };

  requestMock.getMessengerClient.mockImplementation(
    (name: string) =>
      ({
        name,
        sync: jest.fn(),
        upgradeAccount: jest.fn(),
      }) as unknown as MoneyAccountUpgradeController,
  );

  return requestMock;
}

describe('MoneyAccountUpgradeServiceInit', () => {
  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();

    expect(
      MoneyAccountUpgradeServiceInit(requestMock).messengerClient,
    ).toBeInstanceOf(MoneyAccountUpgradeService);
  });

  it('retrieves the upgrade controller it drives', () => {
    const requestMock = buildInitRequestMock();

    MoneyAccountUpgradeServiceInit(requestMock);

    expect(requestMock.getMessengerClient).toHaveBeenCalledWith(
      'MoneyAccountUpgradeController',
    );
  });
});
