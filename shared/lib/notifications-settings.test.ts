import {
  getNotificationsSettingsSectionTypeFromSlug,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
} from './notifications-settings';

describe('NOTIFICATIONS_SETTINGS_SECTION_ROUTES', () => {
  it('has a null prototype so inherited keys cannot pollute lookups', () => {
    expect(Object.getPrototypeOf(NOTIFICATIONS_SETTINGS_SECTION_ROUTES)).toBe(
      null,
    );
    for (const key of ['constructor', '__proto__', 'toString']) {
      expect(
        Reflect.get(NOTIFICATIONS_SETTINGS_SECTION_ROUTES, key),
      ).toBeUndefined();
    }
  });
});

describe('getNotificationsSettingsSectionTypeFromSlug', () => {
  for (const [slug, sectionType] of [
    ['wallet-activity', 'walletActivity'],
    ['perps', 'perps'],
    ['marketing', 'marketing'],
    ['agentic-cli', 'agenticCli'],
    ['  Wallet-Activity  ', 'walletActivity'],
    ['PERPS', 'perps'],
  ]) {
    it(`returns section type "${sectionType}" for slug "${slug}"`, () => {
      expect(getNotificationsSettingsSectionTypeFromSlug(slug)).toBe(
        sectionType,
      );
    });
  }

  for (const slug of [
    'price-alerts',
    'walletactivity',
    'constructor',
    '__proto__',
    'toString',
    '../marketing',
    '',
    '   ',
    null,
    undefined,
  ]) {
    it(`returns null for unsupported or missing slug ${JSON.stringify(slug)}`, () => {
      expect(getNotificationsSettingsSectionTypeFromSlug(slug)).toBeNull();
    });
  }
});
