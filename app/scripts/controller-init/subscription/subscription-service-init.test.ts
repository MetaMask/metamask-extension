import { ControllerInitRequest } from '../types';
import { getSubscriptionServiceMessenger } from '../messengers/subscription';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { SubscriptionServiceMessenger } from '../../services/subscription/types';
import { SubscriptionService } from '../../services/subscription/subscription-service';
import { SubscriptionServiceInit } from './subscription-service-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SubscriptionServiceMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSubscriptionServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('SubscriptionServiceInit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(SubscriptionServiceInit(requestMock).controller).toBeInstanceOf(
      SubscriptionService,
    );
  });
});
