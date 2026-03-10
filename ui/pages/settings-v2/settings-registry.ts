/* eslint-disable import/no-useless-path-segments */
/* eslint-disable import/extensions */
import { type ComponentType } from 'react';
import {
  ACCOUNT_IDENTICON_ROUTE,
  ASSETS_ROUTE,
  CURRENCY_ROUTE,
  LANGUAGE_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
  SETTINGS_V2_ROUTE,
  THEME_ROUTE,
  PRIVACY_ROUTE,
} from '../../helpers/constants/routes';
import { IconName } from '../../components/component-library';
import { DynamicImportType, mmLazy } from '../../helpers/utils/mm-lazy';

export type SettingsV2MenuListItem = {
  id: string;
  /** Absolute path, e.g. SETTINGS_V2_ROUTE + '/privacy' */
  path: string;
  /** i18n key for menu list item label */
  labelKey: string;
  iconName: IconName;
  /** Lazy-loaded menu list item content component */
  component: ComponentType;
};

/**
 * Route meta for header title and back navigation.
 * Used by the layout to derive title and backRoute from pathname.
 */
export type SettingsV2RouteMeta = {
  labelKey: string;
  /** Parent path for back button; undefined = root (back goes to app home) */
  parentPath?: string;
};

// Map from path to route meta. Sub-pages (e.g. currency) must be listed here.
export const SETTINGS_V2_ROUTE_META: Record<string, SettingsV2RouteMeta> = {
  [SETTINGS_V2_ROUTE]: { labelKey: 'settings' },
  // Assets tab
  [ASSETS_ROUTE]: {
    labelKey: 'assets',
    parentPath: SETTINGS_V2_ROUTE,
  },
  [CURRENCY_ROUTE]: {
    labelKey: 'localCurrency',
    parentPath: ASSETS_ROUTE,
  },
  // Preferences and display tab
  [PREFERENCES_AND_DISPLAY_ROUTE]: {
    labelKey: 'preferencesAndDisplay',
    parentPath: SETTINGS_V2_ROUTE,
  },
  [THEME_ROUTE]: {
    labelKey: 'theme',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
  },
  [LANGUAGE_ROUTE]: {
    labelKey: 'language',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
  },
  [ACCOUNT_IDENTICON_ROUTE]: {
    labelKey: 'accountIdenticon',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
  },
  // Privacy tab
  [PRIVACY_ROUTE]: {
    labelKey: 'privacy',
    parentPath: SETTINGS_V2_ROUTE,
  },
};

/**
 * Returns route meta for the given pathname, or null if not a known settings v2 route.
 * @param pathname
 */
export function getSettingsV2RouteMeta(
  pathname: string,
): SettingsV2RouteMeta | null {
  return SETTINGS_V2_ROUTE_META[pathname] ?? null;
}

// Registry of all Settings V2 menu list items. Order here defines menu order in the UI.
export const SETTINGS_V2_MENU_LIST_ITEM_REGISTRY: SettingsV2MenuListItem[] = [
  {
    id: 'assets',
    path: ASSETS_ROUTE,
    labelKey: 'assets',
    iconName: IconName.Dollar,
    component: mmLazy(
      (() => import('./assets-tab/index.ts')) as unknown as DynamicImportType,
    ),
  },
  {
    id: 'preferences-and-display',
    path: PREFERENCES_AND_DISPLAY_ROUTE,
    labelKey: 'preferencesAndDisplay',
    iconName: IconName.Setting,
    component: mmLazy(
      (() =>
        import(
          './preferences-and-display-tab/index.ts'
        )) as unknown as DynamicImportType,
    ),
  },
  {
    id: 'privacy',
    path: PRIVACY_ROUTE,
    labelKey: 'privacy',
    iconName: IconName.Lock,
    component: mmLazy(
      (() => import('./privacy-tab/index.ts')) as unknown as DynamicImportType,
    ),
  },
];
