import {
  NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE,
  NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
  NOTIFICATIONS_SETTINGS_PERPS_ROUTE,
  NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
} from '../../helpers/constants/routes';
import {
  getNotificationsSettingsSectionRoute,
  getNotificationsSettingsSectionTypeFromPath,
} from './notifications-settings-routes';

describe('notifications-settings-routes', () => {
  describe('getNotificationsSettingsSectionRoute', () => {
    it('returns the registered route for each section type', () => {
      expect(getNotificationsSettingsSectionRoute('walletActivity')).toBe(
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
      expect(getNotificationsSettingsSectionRoute('perps')).toBe(
        NOTIFICATIONS_SETTINGS_PERPS_ROUTE,
      );
      expect(getNotificationsSettingsSectionRoute('marketing')).toBe(
        NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
      );
      expect(getNotificationsSettingsSectionRoute('agenticCli')).toBe(
        NOTIFICATIONS_SETTINGS_AGENTIC_CLI_ROUTE,
      );
    });
  });

  describe('getNotificationsSettingsSectionTypeFromPath', () => {
    it('returns the section type for registered routes', () => {
      expect(
        getNotificationsSettingsSectionTypeFromPath(
          NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
        ),
      ).toBe('walletActivity');
      expect(
        getNotificationsSettingsSectionTypeFromPath(
          NOTIFICATIONS_SETTINGS_MARKETING_ROUTE,
        ),
      ).toBe('marketing');
    });

    it('returns null for unknown paths', () => {
      expect(
        getNotificationsSettingsSectionTypeFromPath('/settings/notifications'),
      ).toBeNull();
    });
  });
});
