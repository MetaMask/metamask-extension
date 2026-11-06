import { getIsPerpsIncludedInBuild } from '../../environment';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../notifications-settings';
import { notificationsSettings } from './notifications-settings';

jest.mock('../../environment', () => ({
  getIsPerpsIncludedInBuild: jest.fn(),
}));

describe('notificationsSettings', () => {
  beforeEach(() => {
    jest.mocked(getIsPerpsIncludedInBuild).mockReturnValue(true);
  });

  it('registers the notifications settings deep-link path and title', () => {
    expect(notificationsSettings.pathname).toBe('/notifications-settings');
    expect(notificationsSettings.getTitle(new URLSearchParams())).toBe(
      'deepLink_theNotificationsSettingsPage',
    );
  });

  it('returns the notifications settings path when no section is provided', () => {
    expect(notificationsSettings.handler(new URLSearchParams())).toStrictEqual({
      path: NOTIFICATIONS_SETTINGS_ROUTE,
      query: new URLSearchParams(),
    });
  });

  const sections = [
    ['wallet-activity', '/settings/notifications/wallet-activity'],
    ['perps', '/settings/notifications/perps'],
    ['agentic-cli', '/settings/notifications/agentic-cli'],
    ['marketing', '/settings/notifications/marketing'],
  ];

  for (const [section, path] of sections) {
    it(`returns the section settings path for supported section "${section}"`, () => {
      expect(
        notificationsSettings.handler(new URLSearchParams({ section })),
      ).toStrictEqual({ path, query: new URLSearchParams() });
    });
  }

  it('returns the notifications settings path for the Perps section when Perps is not included in the build', () => {
    jest.mocked(getIsPerpsIncludedInBuild).mockReturnValue(false);

    expect(
      notificationsSettings.handler(new URLSearchParams({ section: 'perps' })),
    ).toStrictEqual({
      path: NOTIFICATIONS_SETTINGS_ROUTE,
      query: new URLSearchParams(),
    });
  });

  for (const section of [
    'unknown',
    '',
    'constructor',
    '__proto__',
    'walletactivity',
    'agenticcli',
    'social-ai',
    'socialAI',
    'price-alerts',
    'priceAlerts',
  ]) {
    it(`returns the notifications settings path for unsupported section "${section}"`, () => {
      expect(
        notificationsSettings.handler(
          new URLSearchParams({ section, unrelated: 'ignored' }),
        ),
      ).toStrictEqual({
        path: NOTIFICATIONS_SETTINGS_ROUTE,
        query: new URLSearchParams(),
      });
    });
  }
});
