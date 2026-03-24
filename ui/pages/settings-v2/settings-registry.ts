/* eslint-disable import-x/no-useless-path-segments */
/* eslint-disable import-x/extensions */
import { type ComponentType } from 'react';
import { IconName } from '@metamask/design-system-react';
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
  SECURITY_AND_PASSWORD_ROUTE,
  SETTINGS_V2_ROUTE,
  TRANSACTIONS_ROUTE,
  THEME_ROUTE,
  PRIVACY_ROUTE,
  THIRD_PARTY_APIS_ROUTE,
} from '../../helpers/constants/routes';
import { mmLazy } from '../../helpers/utils/mm-lazy';

/**
 * Route definition for a Settings V2 page.
 */
export type SettingsV2RouteMeta = {
  /** i18n key for the route label (used in header, breadcrumbs, TabBar) */
  labelKey: string;
  /** Parent path for back navigation; undefined = settings root */
  parentPath?: string;
  /** Lazy-loaded component to render for this route */
  component?: ComponentType;
  /** If true, this route appears as a tab in the TabBar */
  isTab?: boolean;
  /** Icon for TabBar (required if isTab is true) */
  iconName?: IconName;
};

/**
 * Single source of truth for all Settings V2 routes.
 * Order of tabs in the TabBar is determined by declaration order of isTab entries.
 */
export const SETTINGS_V2_ROUTES: Record<string, SettingsV2RouteMeta> = {
  // Settings root (no component - renders first tab content)
  [SETTINGS_V2_ROUTE]: {
    labelKey: 'settings',
  },

  // --- Preferences and Display tab ---
  [PREFERENCES_AND_DISPLAY_ROUTE]: {
    labelKey: 'preferencesAndDisplay',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./preferences-and-display-tab/index.ts')),
    isTab: true,
    iconName: IconName.Customize,
  },
  [THEME_ROUTE]: {
    labelKey: 'theme',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
    component: mmLazy(
      () => import('./preferences-and-display-tab/theme-sub-page.tsx'),
    ),
  },
  [LANGUAGE_ROUTE]: {
    labelKey: 'language',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
    component: mmLazy(
      () => import('./preferences-and-display-tab/language-sub-page.tsx'),
    ),
  },
  [ACCOUNT_IDENTICON_ROUTE]: {
    labelKey: 'accountIdenticon',
    parentPath: PREFERENCES_AND_DISPLAY_ROUTE,
    component: mmLazy(
      () =>
        import('./preferences-and-display-tab/account-identicon-sub-page.tsx'),
    ),
  },

  // --- Notifications tab ---
  [NOTIFICATIONS_SETTINGS_ROUTE]: {
    labelKey: 'notifications',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(
      () => import('../notifications-settings/notifications-settings.tsx'),
    ),
    isTab: true,
    iconName: IconName.Notification,
  },

  // --- Security and Password tab ---
  [SECURITY_AND_PASSWORD_ROUTE]: {
    labelKey: 'securityAndPassword',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./security-and-password-tab/index.ts')),
    isTab: true,
    iconName: IconName.SecurityKey,
  },
  [AUTO_LOCK_ROUTE]: {
    labelKey: 'autoLock',
    parentPath: SECURITY_AND_PASSWORD_ROUTE,
    component: mmLazy(
      () => import('./security-and-password-tab/auto-lock-sub-page.tsx'),
    ),
  },

  // --- Privacy tab ---
  [PRIVACY_ROUTE]: {
    labelKey: 'privacy',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./privacy-tab/index.ts')),
    isTab: true,
    iconName: IconName.Lock,
  },
  [THIRD_PARTY_APIS_ROUTE]: {
    labelKey: 'thirdPartyApis',
    parentPath: PRIVACY_ROUTE,
    component: mmLazy(
      () => import('./privacy-tab/third-party-apis-sub-page.tsx'),
    ),
  },

  // --- Backup and sync tab ---
  [BACKUPANDSYNC_ROUTE]: {
    labelKey: 'backupAndSync',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(
      () => import('../settings/backup-and-sync-tab/backup-and-sync-tab.tsx'),
    ),
    isTab: true,
    iconName: IconName.SecurityTime,
  },

  // --- Assets tab ---
  [ASSETS_ROUTE]: {
    labelKey: 'assets',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./assets-tab/index.ts')),
    isTab: true,
    iconName: IconName.Coin,
  },
  [CURRENCY_ROUTE]: {
    labelKey: 'localCurrency',
    parentPath: ASSETS_ROUTE,
    component: mmLazy(() => import('./assets-tab/currency-sub-page.tsx')),
  },

  // --- Transactions tab ---
  [TRANSACTIONS_ROUTE]: {
    labelKey: 'transactions',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./transactions-tab/index.ts')),
    isTab: true,
    iconName: IconName.SwapVertical,
  },

  // --- Experimental tab ---
  [EXPERIMENTAL_ROUTE]: {
    labelKey: 'experimental',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(
      () => import('../settings/experimental-tab/experimental-tab.tsx'),
    ),
    isTab: true,
    iconName: IconName.Flask,
  },

  // --- Developer Options tab ---
  [DEVELOPER_OPTIONS_V2_ROUTE]: {
    labelKey: 'developerOptions',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./developer-options-tab/index.ts')),
    isTab: true,
    iconName: IconName.Code,
  },
};

/**
 * Returns route definition for the given pathname, or null if not found.
 *
 * @param pathname - The route pathname to look up
 */
export function getSettingsV2RouteMeta(
  pathname: string,
): SettingsV2RouteMeta | null {
  return SETTINGS_V2_ROUTES[pathname] ?? null;
}

type TabRouteMeta = SettingsV2RouteMeta &
  Required<Pick<SettingsV2RouteMeta, 'iconName' | 'component'>>;

type RenderableRouteMeta = SettingsV2RouteMeta &
  Required<Pick<SettingsV2RouteMeta, 'component'>>;

/**
 * Derived list of tabs for the TabBar, in order of declaration.
 */
export const SETTINGS_V2_TABS = Object.entries(SETTINGS_V2_ROUTES)
  .filter((entry): entry is [string, TabRouteMeta] => {
    const [, meta] = entry;
    return Boolean(meta.isTab && meta.iconName && meta.component);
  })
  .map(([path, meta]) => ({
    id: path.split('/').pop() || path,
    path,
    labelKey: meta.labelKey,
    iconName: meta.iconName,
    component: meta.component,
  }));

/**
 * All routes that have a component (for generating Route elements).
 */
export const SETTINGS_V2_RENDERABLE_ROUTES = Object.entries(SETTINGS_V2_ROUTES)
  .filter((entry): entry is [string, RenderableRouteMeta] => {
    const [, meta] = entry;
    return Boolean(meta.component);
  })
  .map(([path, meta]) => ({
    path,
    component: meta.component,
  }));
