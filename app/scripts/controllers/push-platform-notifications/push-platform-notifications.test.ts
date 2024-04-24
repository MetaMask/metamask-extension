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
      await withController(async ({ controller, messenger }) => {
        mockAuthBearerTokenCall(messenger);
        jest
          .spyOn(services, 'activatePushNotifications')
          .mockResolvedValue(MOCK_FCM_TOKEN);

        await controller.enablePushNotifications(MOCK_TRIGGERS);
        expect(controller.state.fcmToken).toBe(MOCK_FCM_TOKEN);
      });
    });

    it('should fail if a jwt token is not provided', async () => {
      await withController(async ({ messenger, controller }) => {
        mockAuthBearerTokenCall(messenger).mockResolvedValue(
          null as unknown as string,
        );
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
        mockAuthBearerTokenCall(messenger);
        await controller.disablePushNotifications(MOCK_TRIGGERS);
        expect(controller.state.fcmToken).toBe('');
      });
    });

    it('should fail if a jwt token is not provided', async () => {
      await withController(async ({ messenger, controller }) => {
        mockAuthBearerTokenCall(messenger).mockResolvedValue(
          null as unknown as string,
        );
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
        mockAuthBearerTokenCall(messenger);
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

function mockAuthBearerTokenCall(
  messenger: PushPlatformNotificationsControllerMessenger,
) {
  type Fn = AuthenticationControllerGetBearerToken['handler'];
  const mockAuthGetBearerToken = jest
    .fn<ReturnType<Fn>, Parameters<Fn>>()
    .mockResolvedValue(MOCK_JWT);

  jest.spyOn(messenger, 'call').mockImplementation((...args) => {
    const [actionType] = args;
    if (actionType === 'AuthenticationController:getBearerToken') {
      return mockAuthGetBearerToken();
    }

    throw new Error('MOCK - unsupported messenger call mock');
  });

  return mockAuthGetBearerToken;
}
