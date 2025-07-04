import { Messenger } from '@metamask/base-controller';
import { RateLimitController } from '@metamask/rate-limit-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getRateLimitControllerInitMessenger,
  getRateLimitControllerMessenger,
  RateLimitControllerInitMessenger,
  RateLimitControllerMessenger,
} from '../messengers/snaps';
import { RateLimitControllerInit } from './rate-limit-controller-init';

jest.mock('@metamask/rate-limit-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    RateLimitControllerMessenger,
    RateLimitControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getRateLimitControllerMessenger(baseMessenger),
    initMessenger: getRateLimitControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('RateLimitController', () => {
  it('initializes the controller', () => {
    const { controller } = RateLimitControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(RateLimitController);
  });

  it('does not store state', () => {
    const { memStateKey, persistedStateKey } =
      RateLimitControllerInit(getInitRequestMock());

    expect(memStateKey).toBeNull();
    expect(persistedStateKey).toBeNull();
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
        },
      },
    });
  });
});
