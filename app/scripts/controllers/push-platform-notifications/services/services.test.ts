import * as FirebaseApp from 'firebase/app';
import * as FirebaseMessaging from 'firebase/messaging';
import * as FirebaseMessagingSW from 'firebase/messaging/sw';
import {
  mockEndpointGetPushNotificationLinks,
  mockEndpointUpdatePushNotificationLinks,
} from '../mocks/mockServices';
import * as services from './services';

jest.mock('firebase/app');
jest.mock('firebase/messaging');
jest.mock('firebase/messaging/sw');

const MOCK_REG_TOKEN = 'REG_TOKEN';
const MOCK_NEW_REG_TOKEN = 'NEW_REG_TOKEN';
const MOCK_TRIGGERS = ['1', '2', '3'];
const MOCK_JWT = 'MOCK_JWT';

describe('PushPlatformNotificationsServices', () => {
  describe('getPushNotificationLinks', () => {
    it('Should return reg token links', async () => {
      const mockGetLinksEndpoint = mockEndpointGetPushNotificationLinks();
      const res = await services.getPushNotificationLinks(MOCK_JWT);

      expect(mockGetLinksEndpoint.isDone()).toBe(true);
      expect(res).toBeDefined();
      expect(res?.trigger_ids).toBeDefined();
      expect(res?.registration_tokens).toBeDefined();
    });

    it('Should return null if api call fails', async () => {
      const mockGetLinksEndpoint = mockEndpointGetPushNotificationLinks({
        status: 500,
      });
      const res = await services.getPushNotificationLinks(MOCK_JWT);

      expect(mockGetLinksEndpoint.isDone()).toBe(true);
      expect(res).toBeNull();
    });
  });

  describe('updateLinksAPI', () => {
    it('Should return true if links are updated', async () => {
      const mockUpdateLinksEndpoint = mockEndpointUpdatePushNotificationLinks();

      const res = await services.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        { token: MOCK_NEW_REG_TOKEN, platform: 'extension' },
      ]);

      expect(mockUpdateLinksEndpoint.isDone()).toBe(true);
      expect(res).toBe(true);
    });

    it('Should return false if links are not updated', async () => {
      mockEndpointUpdatePushNotificationLinks({ status: 500 });

      const res = await services.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        { token: MOCK_NEW_REG_TOKEN, platform: 'extension' },
      ]);

      expect(res).toBe(false);
    });
  });

  describe('activatePushNotifications()', () => {
    it('should append registration token when enabling push', async () => {
      arrangeEndpoints();
      arrangeFCMMocks();

      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(MOCK_NEW_REG_TOKEN);
    });

    it('should fail if unable to get existing notification links', async () => {
      mockEndpointGetPushNotificationLinks({ status: 500 });

      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
      expect(res).toBeNull();
    });

    it('should fail if unable to create new reg token', async () => {
      arrangeEndpoints();
      const fcmMocks = arrangeFCMMocks();
      fcmMocks.getToken.mockRejectedValue(new Error('MOCK ERROR'));
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
      expect(res).toBeNull();
    });

    it('should silently fail and return if failed to activate push notifications', async () => {
      mockEndpointGetPushNotificationLinks();
      mockEndpointUpdatePushNotificationLinks({ status: 500 });
      arrangeFCMMocks();
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      // We return the registration token, but we haven't updating the links.
      // This can be redone at a later invocation (e.g. when the extension is re-initialized or notification setting changes)
      expect(res).toBe(MOCK_NEW_REG_TOKEN);
    });
  });

  describe('deactivatePushNotifications()', () => {
    it('should fail if unable to get existing notification links', async () => {
      mockEndpointGetPushNotificationLinks({ status: 500 });

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to update links', async () => {
      mockEndpointGetPushNotificationLinks();
      mockEndpointUpdatePushNotificationLinks({ status: 500 });

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to delete reg token', async () => {
      arrangeEndpoints();
      const fcmMocks = arrangeFCMMocks();
      fcmMocks.deleteToken.mockRejectedValue(new Error('MOCK FAIL'));

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });
  });

  describe('updateTriggerPushNotifications()', () => {
    it('should update triggers for push notifications', async () => {
      arrangeEndpoints();

      const res = await services.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toEqual({
        isTriggersLinkedToPushNotifications: true,
        fcmToken: expect.any(String),
      });
    });

    it('should fail if unable to update triggers', async () => {
      mockEndpointGetPushNotificationLinks();
      mockEndpointUpdatePushNotificationLinks({ status: 500 });

      const res = await services.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toEqual({
        isTriggersLinkedToPushNotifications: false,
        fcmToken: expect.any(String),
      });
    });
  });

  function arrangeEndpoints() {
    const mockGetLinksEndpoint = mockEndpointGetPushNotificationLinks();
    const mockUpdateLinksEndpoint = mockEndpointUpdatePushNotificationLinks();

    return {
      mockGetLinksEndpoint,
      mockUpdateLinksEndpoint,
    };
  }

  function arrangeFCMMocks() {
    const mockFirebaseApp: FirebaseApp.FirebaseApp = {
      name: '',
      automaticDataCollectionEnabled: false,
      options: {},
    };
    const mockFirebaseMessaging: FirebaseMessagingSW.Messaging = {
      app: mockFirebaseApp,
    };

    jest.spyOn(FirebaseApp, 'getApp').mockReturnValue(mockFirebaseApp);
    jest.spyOn(FirebaseApp, 'initializeApp').mockReturnValue(mockFirebaseApp);

    const getMessaging = jest
      .spyOn(FirebaseMessagingSW, 'getMessaging')
      .mockReturnValue(mockFirebaseMessaging);
    const onBackgroundMessage = jest
      .spyOn(FirebaseMessagingSW, 'onBackgroundMessage')
      .mockReturnValue(() => jest.fn());

    const getToken = jest
      .spyOn(FirebaseMessaging, 'getToken')
      .mockResolvedValue(MOCK_NEW_REG_TOKEN);
    const deleteToken = jest
      .spyOn(FirebaseMessaging, 'deleteToken')
      .mockResolvedValue(true);

    return {
      getMessaging,
      onBackgroundMessage,
      getToken,
      deleteToken,
    };
  }
});
