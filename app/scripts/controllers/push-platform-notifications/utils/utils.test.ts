import * as FirebaseApp from '../firebase/lib/firebase-app';
import * as FirebaseMessaging from '../firebase/lib/firebase-messaging';
import { PushPlatformNotificationsUtils } from './utils';

type MockMessaging = {
  getToken: () => Promise<string>;
  deleteToken: () => Promise<boolean>;
};

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

const MOCK_APP = {
  name: 'testApp',
  options: {
    apiKey: 'testApiKey',
    authDomain: 'testAuthDomain',
    databaseURL: 'testDatabaseURL',
    projectId: 'testProjectId',
    storageBucket: 'testStorageBucket',
    messagingSenderId: 'testMessagingSenderId',
    appId: 'testAppId',
    measurementId: 'testMeasurementId',
  },
  automaticDataCollectionEnabled: false,
};
const MOCK_JWT = 'MOCK_JWT';
const MOCK_MESSAGING: MockMessaging = {
  getToken: jest.fn().mockResolvedValue('MOCK_REG_TOKEN'),
  deleteToken: jest.fn().mockResolvedValue(true),
};
const MOCK_NEW_REG_TOKEN = 'NEW_REG_TOKEN';
const MOCK_TRIGGERS = ['1', '2', '3'];
const MOCK_REG_TOKEN = 'REG_TOKEN';
const MOCK_RESPONSE: MockResponse = {
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
      .mockReturnValue(
        MOCK_MESSAGING as ReturnType<typeof FirebaseMessaging.getMessaging>,
      );
    jest.spyOn(FirebaseMessaging, 'getToken').mockResolvedValue(MOCK_REG_TOKEN);

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;
    const result = await utils.createRegToken();

    expect(result).toBe(MOCK_REG_TOKEN);
  });

  it('returns null if an error occurs', async () => {
    await PushPlatformNotificationsUtils.createFirebaseApp();
    jest
      .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
      .mockImplementationOnce(() => {
        throw new Error();
      });

    const utils = PushPlatformNotificationsUtils as unknown as TestUtils;
    const result = await utils.createRegToken();

    expect(result).toBeNull();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('deleteRegToken', () => {
  const utils = PushPlatformNotificationsUtils as unknown as TestUtils;

  it('returns true if the token is successfully deleted', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
      .mockResolvedValue(MOCK_APP);
    jest
      .spyOn(FirebaseMessaging, 'getMessaging')
      .mockReturnValue(
        MOCK_MESSAGING as ReturnType<typeof FirebaseMessaging.getMessaging>,
      );
    jest.spyOn(FirebaseMessaging, 'deleteToken').mockResolvedValue(true);

    const result = await utils.deleteRegToken();

    expect(result).toBe(true);
    expect(FirebaseMessaging.deleteToken).toHaveBeenCalledWith(MOCK_MESSAGING);
  });

  it('returns false if an error occurs during token deletion', async () => {
    jest
      .spyOn(PushPlatformNotificationsUtils, 'createFirebaseApp')
      .mockImplementationOnce(() => {
        throw new Error();
      });

    const result = await utils.deleteRegToken();

    expect(result).toBe(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    jest.spyOn(utils, 'updateTriggerPushNotifications').mockResolvedValue(true);

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
