import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { getSubscriptionServiceMessenger } from '../messengers/subscription';
import { buildControllerInitRequestMock } from '../test/utils';
import { SubscriptionServiceMessenger } from '../../services/subscription/types';
import { SubscriptionService } from '../../services/subscription/subscription-service';
import { SubscriptionServiceInit } from './subscription-service-init';

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SubscriptionServiceMessenger>
> {
  const baseControllerMessenger = new Messenger<never, never>();

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
