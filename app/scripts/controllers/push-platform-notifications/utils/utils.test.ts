import * as FirebaseApp from '../firebase/lib/firebase-app';
import * as FirebaseMessaging from '../firebase/lib/firebase-messaging';
import { PushPlatformNotificationsUtils } from './utils';

const MOCK_APP = {};
const MOCK_JWT = 'MOCK_JWT';
const MOCK_MESSAGING = {};
const MOCK_NEW_REG_TOKEN = 'NEW_REG_TOKEN';
const MOCK_TRIGGERS = ['1', '2', '3'];
const MOCK_REG_TOKEN = 'REG_TOKEN';
const MOCK_RESPONSE = {
  trigger_ids: ['1', '2', '3'],
  registration_tokens: ['reg-token-1', 'reg-token-2'],
};

describe('createFirebaseApp', () => {
  it('returns existing app if it exists', async () => {
    const getAppSpy = jest
      .spyOn(FirebaseApp, 'getApp')
      .mockReturnValueOnce(MOCK_APP);

    const result = await PushPlatformNotificationsUtils.createFirebaseApp();

    expect(result).toBe(MOCK_APP);
    expect(getAppSpy).toHaveBeenCalled();
  });

  it('initializes new app if no existing app', async () => {
    const getAppSpy = jest
      .spyOn(FirebaseApp, 'getApp')
      .mockImplementationOnce(() => {
        throw new Error();
      });
    const initializeAppSpy = jest
      .spyOn(FirebaseApp, 'initializeApp')
      .mockReturnValueOnce(MOCK_APP);

    const result = await PushPlatformNotificationsUtils.createFirebaseApp();

    expect(result).toBe(MOCK_APP);
    expect(getAppSpy).toHaveBeenCalled();
    expect(initializeAppSpy).toHaveBeenCalled();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('createRegToken', () => {
  it('returns token if no errors occur', async () => {
    await PushPlatformNotificationsUtils.createFirebaseApp();
    jest
      .spyOn(FirebaseMessaging, 'getMessaging')
      .mockReturnValue(MOCK_MESSAGING);
    jest.spyOn(FirebaseMessaging, 'getToken').mockResolvedValue(MOCK_REG_TOKEN);

    const result = await (
      PushPlatformNotificationsUtils as any
    ).createRegToken();

    expect(result).toBe(MOCK_REG_TOKEN);
  });

  it('returns null if an error occurs', async () => {
    await PushPlatformNotificationsUtils.createFirebaseApp();
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'createFirebaseApp')
      .mockImplementationOnce(() => {
        throw new Error();
      });

    const result = await (
      PushPlatformNotificationsUtils as any
    ).createRegToken();

    expect(result).toBeNull();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('deleteRegToken', () => {
  it('returns true if the token is successfully deleted', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
      .mockResolvedValue(MOCK_APP as any);
    jest
      .spyOn(FirebaseMessaging, 'getMessaging')
      .mockReturnValue(MOCK_MESSAGING as any);
    jest.spyOn(FirebaseMessaging, 'deleteToken').mockResolvedValue(true);

    // Act
    const result = await (
      PushPlatformNotificationsUtils as any
    ).deleteRegToken();

    // Assert
    expect(result).toBe(true);
    expect(FirebaseMessaging.deleteToken).toHaveBeenCalledWith(MOCK_MESSAGING);
  });

  it('returns false if an error occurs during token deletion', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
      .mockImplementationOnce(() => {
        throw new Error();
      });

    const result = await (
      PushPlatformNotificationsUtils as any
    ).deleteRegToken();

    expect(result).toBe(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe(' getPushNotificationLinks()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should return reg token links', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValue(MOCK_RESPONSE);
    const res = await (
      PushPlatformNotificationsUtils as any
    ).getPushNotificationLinks(MOCK_JWT);
    expect(res).toBeDefined();
    expect(res?.trigger_ids).toBeDefined();
    expect(res?.registration_tokens).toBeDefined();
  });

  it('Should return null if api call fails', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValue(null);
    const res = await (
      PushPlatformNotificationsUtils as any
    ).getPushNotificationLinks(MOCK_JWT);
    expect(res).toBeNull();
  });
});

describe('updateLinksAPI()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should return true if links are updated', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'updateLinksAPI')
      .mockResolvedValue(true);
    const res = await (PushPlatformNotificationsUtils as any).updateLinksAPI(
      MOCK_JWT,
      MOCK_TRIGGERS,
      [MOCK_NEW_REG_TOKEN],
    );
    expect(res).toBe(true);
  });

  it('Should return false if links are not updated', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'updateLinksAPI')
      .mockResolvedValue(false);
    const res = await (PushPlatformNotificationsUtils as any).updateLinksAPI(
      MOCK_JWT,
      MOCK_TRIGGERS,
      [MOCK_NEW_REG_TOKEN],
    );
    expect(res).toBe(false);
  });
});

describe('enablePushNotifications()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should append registration token when enabling push', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'enablePushNotifications')
      .mockResolvedValue(MOCK_NEW_REG_TOKEN);
    const res = await PushPlatformNotificationsUtils.enablePushNotifications(
      MOCK_JWT,
      MOCK_TRIGGERS,
    );

    expect(res).toBe(MOCK_NEW_REG_TOKEN);
  });

  it('should fail if unable to get existing notification links', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValueOnce(null);
    const res = await PushPlatformNotificationsUtils.enablePushNotifications(
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
    expect(res).toBeNull();
  });

  it('should fail if unable to create new reg token', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'createRegToken')
      .mockResolvedValueOnce(null);
    const res = await PushPlatformNotificationsUtils.enablePushNotifications(
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
    expect(res).toBeNull();
  });

  it('should fail if unable to update links', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'updateLinksAPI')
      .mockResolvedValueOnce(false);
    const res = await PushPlatformNotificationsUtils.enablePushNotifications(
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
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

  it('should remove registration token when disabling push', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValue(MOCK_RESPONSE);
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'deleteRegToken')
      .mockResolvedValue(true);
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'updateLinksAPI')
      .mockResolvedValue(true);
    const res = await PushPlatformNotificationsUtils.disablePushNotifications(
      MOCK_REG_TOKEN,
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
    expect(res).toBe(true);
  });

  it('should fail if unable to get existing notification links', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValueOnce(null);
    const res = await PushPlatformNotificationsUtils.disablePushNotifications(
      MOCK_REG_TOKEN,
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
    expect(res).toBe(false);
  });

  it('should fail if unable to update links', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValue(MOCK_RESPONSE);
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'updateLinksAPI')
      .mockResolvedValue(false);
    const res = await PushPlatformNotificationsUtils.disablePushNotifications(
      MOCK_REG_TOKEN,
      MOCK_JWT,
      MOCK_TRIGGERS,
    );
    expect(res).toBe(false);
  });

  it('should fail if unable to delete reg token', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'getPushNotificationLinks')
      .mockResolvedValue(MOCK_RESPONSE);
    jest
      .spyOn(PushPlatformNotificationsUtils as any, 'deleteRegToken')
      .mockResolvedValue(false);
    const res = await PushPlatformNotificationsUtils.disablePushNotifications(
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

  it('should update triggers for push notifications', async () => {
    jest
      .spyOn(
        PushPlatformNotificationsUtils as any,
        'updateTriggerPushNotifications',
      )
      .mockResolvedValue(true);
    const res =
      await PushPlatformNotificationsUtils.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
    expect(res).toBe(true);
  });

  it('should fail if unable to update triggers', async () => {
    jest
      .spyOn(
        PushPlatformNotificationsUtils as any,
        'updateTriggerPushNotifications',
      )
      .mockResolvedValue(false);
    const res =
      await PushPlatformNotificationsUtils.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
    expect(res).toBe(false);
  });
});
