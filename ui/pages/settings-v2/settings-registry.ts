/* eslint-disable import-x/no-useless-path-segments */
/* eslint-disable import-x/extensions */
import { type ComponentType } from 'react';
import {
  ACCOUNT_IDENTICON_ROUTE,
  ASSETS_ROUTE,
  AUTO_LOCK_ROUTE,
  BACKUPANDSYNC_ROUTE,
  CURRENCY_ROUTE,
  DEVELOPER_OPTIONS_V2_ROUTE,
  EXPERIMENTAL_ROUTE,
  LANGUAGE_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
  SETTINGS_V2_ROUTE,
  SECURITY_AND_PASSWORD_ROUTE,
  TRANSACTIONS_ROUTE,
  THEME_ROUTE,
  PRIVACY_ROUTE,
  THIRD_PARTY_APIS_ROUTE,
} from '../../helpers/constants/routes';
import { IconName } from '../../components/component-library';
import { mmLazy } from '../../helpers/utils/mm-lazy';

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
  [TRANSACTIONS_ROUTE]: {
    labelKey: 'transactions',
    parentPath: SETTINGS_V2_ROUTE,
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
  [THIRD_PARTY_APIS_ROUTE]: {
    labelKey: 'thirdPartyApis',
    parentPath: PRIVACY_ROUTE,
  },
  // TODO: Update route after screen is updated
  // Security and password tab
  [SECURITY_AND_PASSWORD_ROUTE]: {
    labelKey: 'securityAndPassword',
    parentPath: SETTINGS_V2_ROUTE,
  },
  [AUTO_LOCK_ROUTE]: {
    labelKey: 'autoLock',
    parentPath: SECURITY_AND_PASSWORD_ROUTE,
  },
  // Backup and sync tab
  [BACKUPANDSYNC_ROUTE]: {
    labelKey: 'backupAndSync',
    parentPath: SETTINGS_V2_ROUTE,
  },
  // Experimental tab
  [EXPERIMENTAL_ROUTE]: {
    labelKey: 'experimental',
    parentPath: SETTINGS_V2_ROUTE,
  },
  // Notifications tab
  [NOTIFICATIONS_SETTINGS_ROUTE]: {
    labelKey: 'notifications',
    parentPath: SETTINGS_V2_ROUTE,
  },
  // Developer options tab
  [DEVELOPER_OPTIONS_V2_ROUTE]: {
    labelKey: 'developerOptions',
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
    component: mmLazy(() => import('./assets-tab/index.ts')),
  },
  {
    id: 'transactions',
    path: TRANSACTIONS_ROUTE,
    labelKey: 'transactions',
    iconName: IconName.Setting,
    component: mmLazy(() => import('./transactions-tab/index.ts')),
  },
  {
    id: 'preferences-and-display',
    path: PREFERENCES_AND_DISPLAY_ROUTE,
    labelKey: 'preferencesAndDisplay',
    iconName: IconName.Setting,
    component: mmLazy(() => import('./preferences-and-display-tab/index.ts')),
  },
  {
    id: 'privacy',
    path: PRIVACY_ROUTE,
    labelKey: 'privacy',
    iconName: IconName.Lock,
    component: mmLazy(() => import('./privacy-tab/index.ts')),
  },
  {
    id: 'security-and-password',
    path: SECURITY_AND_PASSWORD_ROUTE,
    labelKey: 'securityAndPassword',
    iconName: IconName.SecuritySearch,
    component: mmLazy(() => import('./security-and-password-tab/index.ts')),
  },
  {
    id: 'backup-and-sync',
    path: BACKUPANDSYNC_ROUTE,
    labelKey: 'backupAndSync',
    iconName: IconName.SecurityTime,
    component: mmLazy(
      () => import('../settings/backup-and-sync-tab/backup-and-sync-tab.tsx'),
    ),
  },
  {
    id: 'experimental',
    path: EXPERIMENTAL_ROUTE,
    labelKey: 'experimental',
    iconName: IconName.Flask,
    component: mmLazy(
      () => import('../settings/experimental-tab/experimental-tab.tsx'),
    ),
  },
  {
    id: 'notifications',
    path: NOTIFICATIONS_SETTINGS_ROUTE,
    labelKey: 'notifications',
    iconName: IconName.Notification,
    component: mmLazy(
      () => import('../notifications-settings/notifications-settings.tsx'),
    ),
  },
  {
    id: 'developer-options',
    path: DEVELOPER_OPTIONS_V2_ROUTE,
    labelKey: 'developerOptions',
    iconName: IconName.Code,
    component: mmLazy(() => import('./developer-options-tab/index.ts')),
  },
];
