// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { NotificationCategoryId } from '../notifications/notification-categories-types';
import { getNotificationsSettingsSectionRoute } from './notifications-settings-routes';

describe('notifications-settings-routes', () => {
  describe('getNotificationsSettingsSectionRoute', () => {
    it('interpolates the section type into the dynamic route', () => {
      expect(
        getNotificationsSettingsSectionRoute(
          NotificationCategoryId.WalletActivity,
        ),
      ).toBe('/settings/notifications/walletActivity');
      expect(
        getNotificationsSettingsSectionRoute(NotificationCategoryId.Perps),
      ).toBe('/settings/notifications/perps');
      expect(
        getNotificationsSettingsSectionRoute(NotificationCategoryId.Marketing),
      ).toBe('/settings/notifications/marketing');
      expect(
        getNotificationsSettingsSectionRoute(NotificationCategoryId.AgenticCli),
      ).toBe('/settings/notifications/agenticCli');
    });
  });
});
