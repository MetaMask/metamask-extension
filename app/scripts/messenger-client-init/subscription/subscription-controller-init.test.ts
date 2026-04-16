import {
  SubscriptionController,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { MessengerClientInitRequest } from '../types';
import {
  getSubscriptionControllerInitMessenger,
  getSubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger,
} from '../messengers/subscription';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { SubscriptionControllerMessenger } from '../messengers/subscription/subscription-controller-messenger';
import { SubscriptionControllerInit } from './subscription-controller-init';

jest.mock('@metamask/subscription-controller');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    SubscriptionControllerMessenger,
    SubscriptionControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSubscriptionControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getSubscriptionControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('SubscriptionControllerInit', () => {
  const SubscriptionControllerClassMock = jest.mocked(SubscriptionController);

  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      SubscriptionControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(SubscriptionController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    SubscriptionControllerInit(requestMock);

    expect(SubscriptionControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.SubscriptionController,
      subscriptionService: expect.any(SubscriptionService),
    });
  });
});
