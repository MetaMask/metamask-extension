import { MessengerClientInitRequest } from '../types';
import { getShieldSubscriptionServiceMessenger } from '../messengers/subscription';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { ShieldSubscriptionServiceMessenger } from '../../services/subscription/types';
import { ShieldSubscriptionService } from '../../services/subscription/shield-subscription-service';
import { ShieldSubscriptionServiceInit } from './shield-subscription-service-init';

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<ShieldSubscriptionServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getShieldSubscriptionServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('ShieldSubscriptionServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the service instance', () => {
    const requestMock = buildInitRequestMock();

    expect(
      ShieldSubscriptionServiceInit(requestMock).messengerClient,
    ).toBeInstanceOf(ShieldSubscriptionService);
  });
});
