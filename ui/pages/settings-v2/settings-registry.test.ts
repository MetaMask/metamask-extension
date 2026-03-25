import {
  ASSETS_ROUTE,
  CURRENCY_ROUTE,
  PRIVACY_ROUTE,
  SETTINGS_V2_ROUTE,
  THEME_ROUTE,
  THIRD_PARTY_APIS_ROUTE,
} from '../../helpers/constants/routes';
import {
  getSettingsV2RouteMeta,
  SETTINGS_V2_TABS,
  SETTINGS_V2_RENDERABLE_ROUTES,
} from './settings-registry';

describe('settings-registry', () => {
  describe('getSettingsV2RouteMeta', () => {
    it('returns null for unknown routes', () => {
      expect(getSettingsV2RouteMeta('/unknown/route')).toBeNull();
      expect(getSettingsV2RouteMeta('')).toBeNull();
    });

    it('returns metadata for settings root', () => {
      const meta = getSettingsV2RouteMeta(SETTINGS_V2_ROUTE);

      expect(meta).toEqual(
        expect.objectContaining({
          labelKey: 'settings',
        }),
      );
      expect(meta?.parentPath).toBeUndefined();
    });
  });

  describe('SETTINGS_V2_TABS', () => {
    it('all tabs have required properties', () => {
      for (const tab of SETTINGS_V2_TABS) {
        expect(tab.id).toEqual(expect.any(String));
        expect(tab.path).toEqual(expect.any(String));
        expect(tab.labelKey).toEqual(expect.any(String));
        expect(tab.iconName).toEqual(expect.any(String));
        expect(tab.component).toBeDefined();
      }
    });

    it('does not include sub-pages', () => {
      const tabPaths = SETTINGS_V2_TABS.map((tab) => tab.path);

      expect(tabPaths).not.toContain(CURRENCY_ROUTE);
      expect(tabPaths).not.toContain(THEME_ROUTE);
      expect(tabPaths).not.toContain(THIRD_PARTY_APIS_ROUTE);
    });
  });

  describe('SETTINGS_V2_RENDERABLE_ROUTES', () => {
    it('includes both tabs and sub-pages', () => {
      const paths = SETTINGS_V2_RENDERABLE_ROUTES.map((r) => r.path);

      // Tabs
      expect(paths).toContain(ASSETS_ROUTE);
      expect(paths).toContain(PRIVACY_ROUTE);

      // Sub-pages
      expect(paths).toContain(CURRENCY_ROUTE);
      expect(paths).toContain(THEME_ROUTE);
    });

    it('does not include settings root', () => {
      const paths = SETTINGS_V2_RENDERABLE_ROUTES.map((r) => r.path);

      expect(paths).not.toContain(SETTINGS_V2_ROUTE);
    });
  });
});
