import { getIsPerpsIncludedInBuild } from '../../environment';
import { notificationsSettings } from './notifications-settings';
import { NOTIFICATIONS_SETTINGS_ROUTE } from './route';

jest.mock('../../environment', () => ({
  getIsPerpsIncludedInBuild: jest.fn(),
}));

describe('notificationsSettings', () => {
  beforeEach(() => {
    jest.mocked(getIsPerpsIncludedInBuild).mockReturnValue(true);
  });

  it('opens notification settings without a section', () => {
    expect(notificationsSettings.pathname).toBe(NOTIFICATIONS_SETTINGS_ROUTE);
    expect(notificationsSettings.getTitle(new URLSearchParams())).toBe(
      'deepLink_theNotificationsSettingsPage',
    );
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
    it(`opens the ${section} section directly`, () => {
      expect(
        notificationsSettings.handler(new URLSearchParams({ section })),
      ).toStrictEqual({ path, query: new URLSearchParams() });
    });
  }

  it('opens the main page when Perps is not included in the build', () => {
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
    it(`opens the main page for section ${section}`, () => {
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
