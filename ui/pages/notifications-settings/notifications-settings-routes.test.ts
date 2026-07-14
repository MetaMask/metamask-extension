import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';

describe('notifications-settings-routes', () => {
  describe('getNotificationsSettingsSectionRoute', () => {
    it('interpolates the free-form category id into the dynamic route', () => {
      expect(getNotificationsSettingsSectionRoute('walletActivity')).toBe(
        '/settings/notifications/walletActivity',
      );
      expect(getNotificationsSettingsSectionRoute('tradingActivity')).toBe(
        '/settings/notifications/tradingActivity',
      );
      expect(getNotificationsSettingsSectionRoute('updatesAndRewards')).toBe(
        '/settings/notifications/updatesAndRewards',
      );
      expect(getNotificationsSettingsSectionRoute('agenticCli')).toBe(
        '/settings/notifications/agenticCli',
      );
    });
  });
});
