import * as services from './services';

type MockResponse = {
  trigger_ids: string[];
  registration_tokens: string[];
};

const MOCK_REG_TOKEN = 'REG_TOKEN';
const MOCK_NEW_REG_TOKEN = 'NEW_REG_TOKEN';
const MOCK_TRIGGERS = ['1', '2', '3'];
const MOCK_RESPONSE: MockResponse = {
  trigger_ids: ['1', '2', '3'],
  registration_tokens: ['reg-token-1', 'reg-token-2'],
};
const MOCK_JWT = 'MOCK_JWT';

describe('PushPlatformNotificationsServices', () => {
  describe('getPushNotificationLinks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const utils = services;

    it('Should return reg token links', async () => {
      jest
        .spyOn(services, 'getPushNotificationLinks')
        .mockResolvedValue(MOCK_RESPONSE);

      const res = await services.getPushNotificationLinks(MOCK_JWT);

      expect(res).toBeDefined();
      expect(res?.trigger_ids).toBeDefined();
      expect(res?.registration_tokens).toBeDefined();
    });

    it('Should return null if api call fails', async () => {
      jest.spyOn(services, 'getPushNotificationLinks').mockResolvedValue(null);

      const res = await utils.getPushNotificationLinks(MOCK_JWT);
      expect(res).toBeNull();
    });
  });

  describe('updateLinksAPI', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('Should return true if links are updated', async () => {
      jest.spyOn(services, 'updateLinksAPI').mockResolvedValue(true);

      const res = await services.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        MOCK_NEW_REG_TOKEN,
      ]);

      expect(res).toBe(true);
    });

    it('Should return false if links are not updated', async () => {
      jest.spyOn(services, 'updateLinksAPI').mockResolvedValue(false);

      const res = await services.updateLinksAPI(MOCK_JWT, MOCK_TRIGGERS, [
        MOCK_NEW_REG_TOKEN,
      ]);

      expect(res).toBe(false);
    });
  });

  describe('activatePushNotifications()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should append registration token when enabling push', async () => {
      jest
        .spyOn(services, 'activatePushNotifications')
        .mockResolvedValue(MOCK_NEW_REG_TOKEN);
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(MOCK_NEW_REG_TOKEN);
    });

    it('should fail if unable to get existing notification links', async () => {
      jest
        .spyOn(services, 'getPushNotificationLinks')
        .mockResolvedValueOnce(null);
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
      expect(res).toBeNull();
    });

    it('should fail if unable to create new reg token', async () => {
      jest.spyOn(services, 'createRegToken').mockResolvedValueOnce(null);
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
      expect(res).toBeNull();
    });

    it('should fail if unable to update links', async () => {
      jest.spyOn(services, 'updateLinksAPI').mockResolvedValueOnce(false);
      const res = await services.activatePushNotifications(
        MOCK_JWT,
        MOCK_TRIGGERS,
      );
      expect(res).toBeNull();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  describe('deactivatePushNotifications()', () => {
    it('should fail if unable to get existing notification links', async () => {
      jest
        .spyOn(services, 'getPushNotificationLinks')
        .mockResolvedValueOnce(null);

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to update links', async () => {
      jest
        .spyOn(services, 'getPushNotificationLinks')
        .mockResolvedValue(MOCK_RESPONSE);
      jest.spyOn(services, 'updateLinksAPI').mockResolvedValue(false);

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    it('should fail if unable to delete reg token', async () => {
      jest
        .spyOn(services, 'getPushNotificationLinks')
        .mockResolvedValueOnce(MOCK_RESPONSE);
      jest.spyOn(services, 'deleteRegToken').mockResolvedValue(false);

      const res = await services.deactivatePushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(false);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  describe('updateTriggerPushNotifications()', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update triggers for push notifications', async () => {
      jest
        .spyOn(services, 'updateTriggerPushNotifications')
        .mockResolvedValue(true);

      const res = await services.updateTriggerPushNotifications(
        MOCK_REG_TOKEN,
        MOCK_JWT,
        MOCK_TRIGGERS,
      );

      expect(res).toBe(true);
    });

    it('should fail if unable to update triggers', async () => {
      jest
        .spyOn(services, 'updateTriggerPushNotifications')
        .mockResolvedValue(false);

      const res = await services.updateTriggerPushNotifications(
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
