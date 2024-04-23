import { ControllerMessenger } from '@metamask/base-controller';
import type { AuthenticationControllerGetBearerToken } from '../authentication/authentication-controller';
import { PushPlatformNotificationsController } from './push-platform-notifications';

import * as services from './services/services';
import type {
  PushPlatformNotificationsControllerMessenger,
  PushPlatformNotificationsControllerState,
} from './push-platform-notifications';

const MOCK_JWT = 'mockJwt';
const MOCK_FCM_TOKEN = 'mockFcmToken';
const MOCK_TRIGGERS = ['uuid1', 'uuid2'];

describe('PushPlatformNotificationsController', () => {
  describe('enablePushNotifications', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update the state with the fcmToken', async () => {
      await withController(async ({ controller }) => {
        jest
          .spyOn(controller, 'enablePushNotifications')
          .mockImplementation(async () => {
            controller.state.fcmToken = MOCK_FCM_TOKEN;
            return Promise.resolve();
          });
        await controller.enablePushNotifications(MOCK_TRIGGERS);
        expect(controller.state.fcmToken).toBe(MOCK_FCM_TOKEN);
      });
    });

    it('should fail if a jwt token is not provided', async () => {
      await withController(async ({ messenger, controller }) => {
        jest
          .spyOn(messenger, 'call')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(async (...args: any[]) => {
            const [action] = args;
            if (action === 'AuthenticationController:getBearerToken') {
              return undefined;
            }
            return Promise.resolve(null);
          });

        await expect(controller.enablePushNotifications([])).rejects.toThrow();
      });
    });
  });

  describe('disablePushNotifications', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update the state removing the fcmToken', async () => {
      await withController(async ({ messenger, controller }) => {
        jest
          .spyOn(messenger, 'call')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(async (...args: any[]) => {
            const [action] = args;
            if (action === 'AuthenticationController:getBearerToken') {
              return MOCK_JWT;
            }
            return Promise.resolve(null);
          });

        await controller.disablePushNotifications(MOCK_TRIGGERS);
        expect(controller.state.fcmToken).toBe('');
      });
    });

    it('should fail if a jwt token is not provided', async () => {
      await withController(async ({ messenger, controller }) => {
        jest
          .spyOn(messenger, 'call')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(async (...args: any[]) => {
            const [action] = args;
            if (action === 'AuthenticationController:getBearerToken') {
              return undefined;
            }
            return Promise.resolve(null);
          });

        await expect(controller.disablePushNotifications([])).rejects.toThrow();
      });
    });
  });

  describe('updateTriggerPushNotifications', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call updateTriggerPushNotifications with the correct parameters', async () => {
      await withController(async ({ messenger, controller }) => {
        jest
          .spyOn(messenger, 'call')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(async (...args: any[]) => {
            const [action] = args;
            if (action === 'AuthenticationController:getBearerToken') {
              return MOCK_JWT;
            }
            return Promise.resolve(null);
          });

        const spy = jest
          .spyOn(services, 'updateTriggerPushNotifications')
          .mockResolvedValue(true);

        await controller.updateTriggerPushNotifications(MOCK_TRIGGERS);

        expect(spy).toHaveBeenCalledWith(
          controller.state.fcmToken,
          MOCK_JWT,
          MOCK_TRIGGERS,
        );
      });
    });
  });
});

// Test helper functions

type WithControllerCallback<ReturnValue> = ({
  controller,
  initialState,
  messenger,
}: {
  controller: PushPlatformNotificationsController;
  initialState: PushPlatformNotificationsControllerState;
  messenger: PushPlatformNotificationsControllerMessenger;
}) => Promise<ReturnValue> | ReturnValue;

function buildMessenger() {
  return new ControllerMessenger<
    AuthenticationControllerGetBearerToken,
    never
  >();
}

function buildPushPlatformNotificationsControllerMessenger(
  messenger = buildMessenger(),
) {
  return messenger.getRestricted({
    name: 'PushPlatformNotificationsController',
    allowedActions: ['AuthenticationController:getBearerToken'],
  }) as PushPlatformNotificationsControllerMessenger;
}

async function withController<ReturnValue>(
  fn: WithControllerCallback<ReturnValue>,
): Promise<ReturnValue> {
  const messenger = buildPushPlatformNotificationsControllerMessenger();
  const controller = new PushPlatformNotificationsController({
    messenger,
    state: { fcmToken: '' },
  });

  return await fn({
    controller,
    initialState: controller.state,
    messenger,
  });
}
