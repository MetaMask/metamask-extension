import {
  SubscriptionController,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import {
  getSubscriptionControllerInitMessenger,
  getSubscriptionControllerMessenger,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger,
} from '../messengers/subscription';
import { buildControllerInitRequestMock } from '../test/utils';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { SubscriptionControllerInit } from './subscription-controller-init';

jest.mock('@metamask/subscription-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    SubscriptionControllerMessenger,
    SubscriptionControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<never, never>();

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
    expect(SubscriptionControllerInit(requestMock).controller).toBeInstanceOf(
      SubscriptionController,
    );
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
