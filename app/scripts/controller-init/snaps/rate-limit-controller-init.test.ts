import { ControllerMessenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { RateLimitControllerInit } from './rate-limit-controller-init';
import { RateLimitController } from '@metamask/rate-limit-controller';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
  RateLimitControllerInitMessenger,
  RateLimitControllerMessenger,
} from './rate-limit-controller-messenger';

jest.mock('@metamask/rate-limit-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<RateLimitControllerMessenger, RateLimitControllerInitMessenger>
> {
  const baseControllerMessenger = new ControllerMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRateLimitControllerMessenger(baseControllerMessenger),
    initMessenger: getRateLimitControllerInitMessenger(baseControllerMessenger),
  };

  return requestMock;
}

describe('RateLimitController', () => {
  it('initializes the controller', () => {
    const { controller } = RateLimitControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(RateLimitController);
  });

  it('passes the proper arguments to the controller', () => {
    RateLimitControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(RateLimitController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      implementations: {
        showInAppNotification: {
          method: expect.any(Function),
          rateLimitCount: 5,
          rateLimitTimeout: 60_000,
        },
        showNativeNotification: {
          method: expect.any(Function),
          rateLimitCount: 2,
          rateLimitTimeout: 300_000,
        }
      }
    });
  });
});
