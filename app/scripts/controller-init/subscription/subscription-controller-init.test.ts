import {
  SubscriptionController,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { ControllerInitRequest } from '../types';
import {
  getSubscriptionControllerInitMessenger,
  getSubscriptionControllerMessenger,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger,
} from '../messengers/subscription';
import { getRootMessenger } from '../../lib/messenger';
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

  describe('snap initialization handling', () => {
    it('should subscribe to SnapController state changes', () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(
        requestMock.initMessenger,
        'subscribe',
      );

      SubscriptionControllerInit(requestMock);

      expect(subscribeSpy).toHaveBeenCalledWith(
        'SnapController:stateChange',
        expect.any(Function),
      );
    });

    it('should check current snap state during initialization', () => {
      const requestMock = buildInitRequestMock();
      const callSpy = jest.spyOn(requestMock.initMessenger, 'call');

      SubscriptionControllerInit(requestMock);

      expect(callSpy).toHaveBeenCalledWith('SnapController:getState');
    });

    it('should handle missing snap gracefully during initialization', () => {
      const requestMock = buildInitRequestMock();
      jest
        .spyOn(requestMock.initMessenger, 'call')
        .mockImplementation((action: string) => {
          if (action === 'SnapController:getState') {
            return { snaps: {} }; // No message-signing snap
          }
          throw new Error(`Unexpected action: ${action}`);
        });

      // Should not throw
      expect(() => SubscriptionControllerInit(requestMock)).not.toThrow();
    });
  });

  describe('authentication error handling', () => {
    it('should filter snap initialization errors from Sentry', () => {
      const requestMock = buildInitRequestMock();
      const captureSpy = jest.fn();

      // Mock the module to intercept captureException
      jest.resetModules();
      jest.doMock('../../../../shared/lib/sentry', () => ({
        captureException: captureSpy,
      }));

      const { SubscriptionControllerInit: Init } = jest.requireActual(
        './subscription-controller-init',
      );
      Init(requestMock);

      // Get the subscriptionService config
      const serviceConfig =
        SubscriptionControllerClassMock.mock.calls[0]?.[0]?.subscriptionService;
      expect(serviceConfig).toBeDefined();

      // Test error filtering
      const snapError = new Error(
        'Snap not initialized yet - authentication unavailable during startup',
      );
      const otherError = new Error('Some other error');

      // @ts-expect-error - accessing private config for testing
      const captureException = serviceConfig?.config?.captureException;
      if (captureException) {
        captureException(snapError);
        expect(captureSpy).not.toHaveBeenCalled();

        captureException(otherError);
        expect(captureSpy).toHaveBeenCalledWith(otherError);
      }
    });
  });
});
