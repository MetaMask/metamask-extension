import { ControllerMessenger } from '@metamask/base-controller';
import { errorCodes } from '@metamask/rpc-errors';
import {
  ApprovalAcceptedEvent,
  ApprovalRejectedEvent,
  ApprovalRequest,
} from '@metamask/approval-controller';
import { waitFor } from '@testing-library/react';
import {
  OriginThrottlingController,
  OriginThrottlingControllerMessenger,
  OriginThrottlingState,
} from './origin-throttling-controller';

const setupController = ({
  state,
}: {
  state?: Partial<OriginThrottlingState>;
}) => {
  const messenger = new ControllerMessenger<
    never,
    ApprovalAcceptedEvent | ApprovalRejectedEvent
  >();
  const originThrottlingControllerMessenger: OriginThrottlingControllerMessenger =
    messenger.getRestricted({
      name: 'OriginThrottlingController',
      allowedActions: [],
      allowedEvents: [
        'ApprovalController:accepted',
        'ApprovalController:rejected',
      ],
    });

  const controller = new OriginThrottlingController({
    messenger: originThrottlingControllerMessenger,
    state,
  });

  return { controller, messenger };
};

describe('OriginThrottlingController', () => {
  describe('resetOriginThrottlingState', () => {
    it('should reset the throttling state for a given origin', () => {
      const { controller } = setupController({
        state: {
          throttledOrigins: {
            'example.com': { rejections: 3, lastRejection: Date.now() },
          },
        },
      });

      controller.resetOriginThrottlingState('example.com');
      expect(controller.state.throttledOrigins['example.com']).toBeUndefined();
    });
  });

  describe('isOriginBlockedForConfirmations', () => {
    it('should return false if the origin is not throttled', () => {
      const { controller } = setupController({});
      expect(controller.isOriginBlockedForConfirmations('example.com')).toBe(
        false,
      );
    });

    it('should return true if the origin is throttled and within the blocking threshold', () => {
      const { controller } = setupController({
        state: {
          throttledOrigins: {
            'example.com': {
              rejections: 5,
              lastRejection: Date.now(),
            },
          },
        },
      });

      expect(controller.isOriginBlockedForConfirmations('example.com')).toBe(
        true,
      );
    });

    it('should return false if the origin is throttled but outside the blocking threshold', () => {
      const { controller } = setupController({
        state: {
          throttledOrigins: {
            'example.com': {
              rejections: 5,
              lastRejection: Date.now() - 600000, // 10 minutes ago
            },
          },
        },
      });

      expect(controller.isOriginBlockedForConfirmations('example.com')).toBe(
        false,
      );
    });
  });

  describe('ApprovalController:rejected event', () => {
    it('should increase rejection count for user rejected errors', async () => {
      const { controller, messenger } = setupController({});
      const origin = 'example.com';

      messenger.publish('ApprovalController:rejected', {
        approval: {
          origin,
          type: 'transaction',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as ApprovalRequest<any>,
        error: {
          code: errorCodes.provider.userRejectedRequest,
        } as unknown as Error,
      });

      await waitFor(() => {
        expect(controller.state.throttledOrigins[origin].rejections).toBe(1);
      });
    });

    it('should not increase rejection count for non-user rejected errors', () => {
      const { controller, messenger } = setupController({});
      const origin = 'example.com';

      messenger.publish('ApprovalController:rejected', {
        approval: {
          origin,
          type: 'transaction',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as ApprovalRequest<any>,
        error: { code: errorCodes.rpc.internal } as unknown as Error,
      });

      expect(controller.state.throttledOrigins[origin]).toBeUndefined();
    });
  });

  describe('ApprovalController:accepted event', () => {
    it('should reset throttling state on approval acceptance', () => {
      const { controller, messenger } = setupController({
        state: {
          throttledOrigins: {
            'example.com': { rejections: 3, lastRejection: Date.now() },
          },
        },
      });

      messenger.publish('ApprovalController:accepted', {
        approval: {
          origin: 'example.com',
          type: 'transaction',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as unknown as ApprovalRequest<any>,
      });

      expect(controller.state.throttledOrigins['example.com']).toBeUndefined();
    });
  });
});
