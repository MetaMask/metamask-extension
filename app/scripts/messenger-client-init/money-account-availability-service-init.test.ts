import { getRootMessenger } from '../lib/messenger';
import {
  MoneyAccountAvailabilityService,
  MoneyAccountAvailabilityMessenger,
} from '../lib/money/money-account-availability';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { MoneyAccountAvailabilityServiceInit } from './money-account-availability-service-init';
import { getMoneyAccountAvailabilityServiceMessenger } from './messengers/money-account-availability-service-messenger';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<MoneyAccountAvailabilityMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMoneyAccountAvailabilityServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('MoneyAccountAvailabilityServiceInit', () => {
  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();

    expect(
      MoneyAccountAvailabilityServiceInit(requestMock).messengerClient,
    ).toBeInstanceOf(MoneyAccountAvailabilityService);
  });
});
