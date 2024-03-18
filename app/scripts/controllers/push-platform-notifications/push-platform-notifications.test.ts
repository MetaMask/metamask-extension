import { ControllerMessenger } from '@metamask/base-controller';
import { PushPlatformNotificationsController } from './push-platform-notifications';
import { PushPlatformNotificationsUtils } from './utils/utils';
import type {
  PushPlatformNotificationsControllerMessanger,
  PushPlatformNotificationsControllerMessengerActions,
  PushPlatformNotificationsControllerMessengerEvents,
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
      await withController(async ({ controller }) => {
        jest
          .spyOn(controller as any, 'getBearerToken')
          .mockResolvedValue(undefined);

        await expect(controller.enablePushNotifications([])).rejects.toThrow();
      });
    });
  });

  describe('disablePushNotifications', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should update the state removing the fcmToken', async () => {
      await withController(async ({ controller }) => {
        jest
          .spyOn(controller, 'disablePushNotifications')
          .mockImplementation(async () => {
            controller.state.fcmToken = '';
            return Promise.resolve();
          });
        await controller.disablePushNotifications(MOCK_TRIGGERS);
        expect(controller.state.fcmToken).toBe('');
      });
    });

    it('should fail if a jwt token is not provided', async () => {
      await withController(async ({ controller }) => {
        jest
          .spyOn(controller as any, 'getBearerToken')
          .mockResolvedValue(undefined);

        await expect(controller.disablePushNotifications([])).rejects.toThrow();
      });
    });
  });

  describe('updateTriggerPushNotifications', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call updateTriggerPushNotifications with the correct parameters', async () => {
      await withController(async ({ controller }) => {
        const spy = jest
          .spyOn(
            PushPlatformNotificationsUtils,
            'updateTriggerPushNotifications',
          )
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
  messenger: PushPlatformNotificationsControllerMessanger;
}) => Promise<ReturnValue> | ReturnValue;

function buildMessenger() {
  return new ControllerMessenger<
    PushPlatformNotificationsControllerMessengerActions,
    PushPlatformNotificationsControllerMessengerEvents
  >();
}

function buildPushPlatformNotificationsControllerMessanger(
  messenger = buildMessenger(),
) {
  return messenger.getRestricted({
    name: 'PushPlatformNotificationsController',
  });
}

async function withController<ReturnValue>(
  fn: WithControllerCallback<ReturnValue>,
): Promise<ReturnValue> {
  const messenger = buildPushPlatformNotificationsControllerMessanger();
  const getBearerToken = async () => MOCK_JWT;
  const controller = new PushPlatformNotificationsController({
    messenger,
    state: { fcmToken: '' },
    getBearerToken,
  });

  return await fn({
    controller,
    initialState: controller.state,
    messenger,
  });
}
