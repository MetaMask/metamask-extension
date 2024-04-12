import type { FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { getApp, initializeApp } from 'firebase/app';
import { PushPlatformNotificationsUtils } from './utils';

type MockResponse = {
  trigger_ids: string[];
  registration_tokens: string[];
};

type TestUtils = PushPlatformNotificationsUtils & {
  createRegToken(): Promise<string | null>;
  deleteRegToken(): Promise<boolean>;
  getPushNotificationLinks(jwt: string): Promise<MockResponse | null>;
  updateLinksAPI(
    jwt: string,
    triggerIds: string[],
    registrationTokens: string[],
  ): Promise<boolean>;
  enablePushNotifications(
    jwt: string,
    triggerIds: string[],
  ): Promise<string | null>;
  disablePushNotifications(
    regToken: string,
    jwt: string,
    triggerIds: string[],
  ): Promise<boolean>;
  updateTriggerPushNotifications(
    regToken: string,
    jwt: string,
    triggerIds: string[],
  ): Promise<boolean>;
};

const MOCK_REG_TOKEN = 'REG_TOKEN';
const MOCK_NEW_REG_TOKEN = 'NEW_REG_TOKEN';
const MOCK_TRIGGERS = ['1', '2', '3'];
const MOCK_RESPONSE: MockResponse = {
  trigger_ids: ['1', '2', '3'],
  registration_tokens: ['reg-token-1', 'reg-token-2'],
};
const MOCK_JWT = 'MOCK_JWT';

jest.mock('firebase/app', () => ({
  getApp: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn(),
  deleteToken: jest.fn(),
}));

describe('PushPlatformNotificationsUtils', () => {
  describe('createFirebaseApp', () => {
    it('should attempt to get an existing Firebase app', async () => {
      // Setup
      const mockApp: Partial<FirebaseApp> = {}; // Mock FirebaseApp as needed
      (getApp as jest.Mock).mockReturnValue(mockApp);

      // Execute
      const result = await PushPlatformNotificationsUtils.createFirebaseApp();

      // Assert
      expect(getApp).toHaveBeenCalled();
      expect(result).toBe(mockApp);
    });

    it('should initialize a new Firebase app if no existing app is found', async () => {
      // Setup
      const mockApp: Partial<FirebaseApp> = {}; // Mock FirebaseApp as needed
      const error = new Error('App not found');
      (getApp as jest.Mock).mockImplementation(() => {
        throw error;
      });
      (initializeApp as jest.Mock).mockReturnValue(mockApp);

      // Execute
      const result = await PushPlatformNotificationsUtils.createFirebaseApp();

      // Assert
      expect(getApp).toHaveBeenCalled();
      expect(initializeApp).toHaveBeenCalledWith({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        projectId: process.env.FIREBASE_PROJECT_ID,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID,
      });
      expect(result).toBe(mockApp);
    });
  });

  describe('createRegToken', () => {
    let mockApp: Partial<FirebaseApp>;
    let mockMessaging: Partial<Messaging>;

    beforeEach(() => {
      mockApp = {};
      mockMessaging = {}; // Mock Messaging as needed

      jest
        .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
        .mockResolvedValue(mockApp as FirebaseApp);

      (getMessaging as jest.Mock).mockReturnValue(mockMessaging);

      process.env.VAPID_KEY = 'test_vapid_key';
    });

    it('should create a registration token successfully', async () => {
      const expectedToken = 'testToken';
      (getToken as jest.Mock).mockResolvedValue(expectedToken);

      const result = await (
        PushPlatformNotificationsUtils as unknown as TestUtils
      ).createRegToken();

      expect(
        PushPlatformNotificationsUtils.createFirebaseApp,
      ).toHaveBeenCalled();
      expect(getMessaging).toHaveBeenCalledWith(mockApp);
      expect(getToken).toHaveBeenCalledWith(mockMessaging, {
        vapidKey: 'test_vapid_key',
      });
      expect(result).toBe(expectedToken);
    });

    it('should return null if an error occurs', async () => {
      jest
        .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
        .mockImplementationOnce(() => {
          throw new Error();
        });
      const result = await (
        PushPlatformNotificationsUtils as unknown as TestUtils
      ).createRegToken();

      expect(
        PushPlatformNotificationsUtils.createFirebaseApp,
      ).toHaveBeenCalled();
      expect(getMessaging).toHaveBeenCalledWith(mockApp);
      expect(getToken).toHaveBeenCalledWith(mockMessaging, {
        vapidKey: 'test_vapid_key',
      });
      expect(result).toBeNull();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      delete process.env.VAPID_KEY; // Clean up the environment variable
    });
  });

  describe('deleteRegToken', () => {
    let mockApp: Partial<FirebaseApp>;
    let mockMessaging: Messaging; // Use the Messaging type here

    beforeEach(() => {
      mockApp = {};
      // Cast the mock object to the Messaging type while adding the deleteToken method
      mockMessaging = {
        deleteToken: jest.fn(),
      } as unknown as Messaging; // Corrected line

      // Mock implementations
      (getApp as jest.Mock).mockReturnValue(mockApp);
      (initializeApp as jest.Mock).mockReturnValue(mockApp);
      (getMessaging as jest.Mock).mockReturnValue(mockMessaging);
    });

    it('should successfully delete the Firebase Cloud Messaging registration token', async () => {
      // Setup
      (deleteToken as jest.Mock).mockResolvedValue(true);

      // Execute
      const result = await (
        PushPlatformNotificationsUtils as unknown as TestUtils
      ).deleteRegToken();

      // Assert
      expect(getMessaging).toHaveBeenCalledWith(mockApp);
      expect(deleteToken).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should fail to delete the Firebase Cloud Messaging registration token on error', async () => {
      // Setup
      (deleteToken as jest.Mock).mockRejectedValue(
        new Error('Failed to delete token'),
      );

      // Execute
      const result = await (
        PushPlatformNotificationsUtils as unknown as TestUtils
      ).deleteRegToken();

      // Assert
      expect(getMessaging).toHaveBeenCalledWith(mockApp);
      expect(deleteToken).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  describe('getPushNotificationLinks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

    it('Should return reg token links', async () => {
      jest
        .spyOn(
          PushPlatformNotificationsUtils as unknown as TestUtils,
          'getPushNotificationLinks',
        )
        .mockResolvedValue(MOCK_RESPONSE);

      const res = await utils.getPushNotificationLinks(MOCK_JWT);

      expect(res).toBeDefined();
      expect(res?.trigger_ids).toBeDefined();
      expect(res?.registration_tokens).toBeDefined();
    });

    it('Should return null if api call fails', async () => {
      jest
        .spyOn(
          PushPlatformNotificationsUtils as unknown as TestUtils,
          'getPushNotificationLinks',
        )
        .mockResolvedValue(null);

      const res = await utils.getPushNotificationLinks(MOCK_JWT);
      expect(res).toBeNull();
    });
  });

  describe('updateLinksAPI', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

    it('Should return true if links are updated', async () => {
      jest.spyOn(utils, 'updateLinksAPI').mockResolvedValue(true);

      const res = await utils.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        MOCK_NEW_REG_TOKEN,
      ]);

      expect(res).toBe(true);
    });

    it('Should return false if links are not updated', async () => {
      jest.spyOn(utils, 'updateLinksAPI').mockResolvedValue(false);

      const res = await utils.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        MOCK_NEW_REG_TOKEN,
      ]);

      expect(res).toBe(false);
    });
  });

  describe('enablePushNotifications()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

    it('should append registration token when enabling push', async () => {
      jest
        .spyOn(utils as unknown as TestUtils, 'enablePushNotifications')
        .mockResolvedValue(MOCK_NEW_REG_TOKEN);
      const res = await utils.enablePushNotifications(MOCK_JWT, MOCK_TRIGGERS);

      expect(res).toBe(MOCK_NEW_REG_TOKEN);
    });

    it('should fail if unable to get existing notification links', async () => {
      jest.spyOn(utils, 'getPushNotificationLinks').mockResolvedValueOnce(null);
      const res = await utils.enablePushNotifications(MOCK_JWT, MOCK_TRIGGERS);
      expect(res).toBeNull();
    });

    it('should fail if unable to create new reg token', async () => {
      jest.spyOn(utils, 'createRegToken').mockResolvedValueOnce(null);
      const res = await utils.enablePushNotifications(MOCK_JWT, MOCK_TRIGGERS);
      expect(res).toBeNull();
    });

    it('should fail if unable to update links', async () => {
      jest.spyOn(utils, 'updateLinksAPI').mockResolvedValueOnce(false);
      const res = await utils.enablePushNotifications(MOCK_JWT, MOCK_TRIGGERS);
      expect(res).toBeNull();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('disablePushNotifications()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

    it('should remove registration token when disabling push', async () => {
      jest
        .spyOn(utils, 'getPushNotificationLinks')
        .mockResolvedValue(MOCK_RESPONSE);
      jest.spyOn(utils, 'deleteRegToken').mockResolvedValue(true);
      jest.spyOn(utils, 'updateLinksAPI').mockResolvedValue(true);

      const res = await utils.disablePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(true);
    });

    it('should fail if unable to get existing notification links', async () => {
      jest.spyOn(utils, 'getPushNotificationLinks').mockResolvedValueOnce(null);

      const res = await utils.disablePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to update links', async () => {
      jest
        .spyOn(utils, 'getPushNotificationLinks')
        .mockResolvedValue(MOCK_RESPONSE);
      jest.spyOn(utils, 'updateLinksAPI').mockResolvedValue(false);

      const res = await utils.disablePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to delete reg token', async () => {
      jest
        .spyOn(utils, 'getPushNotificationLinks')
        .mockResolvedValue(MOCK_RESPONSE);
      jest.spyOn(utils, 'deleteRegToken').mockResolvedValue(false);

      const res = await utils.disablePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('updateTriggerPushNotifications()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

    it('should update triggers for push notifications', async () => {
      jest
        .spyOn(utils, 'updateTriggerPushNotifications')
        .mockResolvedValue(true);

      const res = await utils.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(true);
    });

    it('should fail if unable to update triggers', async () => {
      jest
        .spyOn(utils, 'updateTriggerPushNotifications')
        .mockResolvedValue(false);

      const res = await utils.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });
});
