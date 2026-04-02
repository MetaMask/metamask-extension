/* eslint-disable import-x/no-useless-path-segments */
/* eslint-disable import-x/extensions */
import { type ComponentType } from 'react';
import { IconName } from '@metamask/design-system-react';
import { matchPath } from 'react-router-dom';
import {
  ACCOUNT_IDENTICON_ROUTE,
  ABOUT_US_ROUTE,
  ASSETS_ROUTE,
  AUTO_LOCK_ROUTE,
  BACKUPANDSYNC_ROUTE,
  CURRENCY_ROUTE,
  DEVELOPER_OPTIONS_ROUTE,
  DEVELOPER_TOOLS_ROUTE,
  MANAGE_WALLET_RECOVERY_V2_ROUTE,
  EXPERIMENTAL_ROUTE,
  LANGUAGE_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  PREFERENCES_AND_DISPLAY_ROUTE,
  SECURITY_AND_PASSWORD_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
  SETTINGS_V2_ROUTE,
  SNAP_SETTINGS_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES,
  TRANSACTION_SHIELD_MANAGE_PAST_PLAN_ROUTE,
  TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
  TRANSACTIONS_ROUTE,
  THEME_ROUTE,
  PRIVACY_ROUTE,
  THIRD_PARTY_APIS_ROUTE,
} from '../../helpers/constants/routes';
import { mmLazy } from '../../helpers/utils/mm-lazy';
import { CLAIMS_TAB_KEYS } from '../settings/transaction-shield-tab/types';

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

export const SETTINGS_V2_ROOT_SECTIONS: readonly {
  titleKeys: readonly string[];
  paths: readonly string[];
}[] = [
  {
    titleKeys: ['general'],
    paths: [PREFERENCES_AND_DISPLAY_ROUTE, NOTIFICATIONS_SETTINGS_ROUTE],
  },
  {
    titleKeys: ['securityAndPrivacy'],
    paths: [SECURITY_AND_PASSWORD_ROUTE, PRIVACY_ROUTE, BACKUPANDSYNC_ROUTE],
  },
  {
    titleKeys: ['transactionsAndAssets'],
    paths: [TRANSACTION_SHIELD_ROUTE, ASSETS_ROUTE, TRANSACTIONS_ROUTE],
  },
  {
    titleKeys: ['moreCapital'],
    paths: [
      EXPERIMENTAL_ROUTE,
      DEVELOPER_OPTIONS_ROUTE,
      DEVELOPER_TOOLS_ROUTE,
      ABOUT_US_ROUTE,
    ],
  },
] as const;

const SHOW_DEBUG_SETTINGS = Boolean(
  process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS || process.env.IN_TEST,
);

const TRANSACTION_SHIELD_CLAIMS_WILDCARD_ROUTE = `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}/*`;
const TRANSACTION_SHIELD_EDIT_DRAFT_ROUTE = `${TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL}/:draftId`;
const TRANSACTION_SHIELD_VIEW_PENDING_ROUTE = `${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.FULL}/:claimId`;
const TRANSACTION_SHIELD_VIEW_HISTORY_ROUTE = `${TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.FULL}/:claimId`;

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
    component: mmLazy(() => import('./notifications-tab/index.ts')),
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
  [MANAGE_WALLET_RECOVERY_V2_ROUTE]: {
    labelKey: 'manageWalletRecovery',
    parentPath: SECURITY_AND_PASSWORD_ROUTE,
    component: mmLazy(
      () =>
        import(
          './security-and-password-tab/manage-wallet-recovery-sub-page.tsx'
        ),
    ),
  },
  [SECURITY_PASSWORD_CHANGE_V2_ROUTE]: {
    labelKey: 'password',
    parentPath: SECURITY_AND_PASSWORD_ROUTE,
    component: mmLazy(
      () => import('./security-and-password-tab/password-sub-page.tsx'),
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

  // --- Transaction Shield tab ---
  [TRANSACTION_SHIELD_ROUTE]: {
    labelKey: 'shieldTx',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(
      () => import('../settings/transaction-shield-tab/index.ts'),
    ),
    isTab: true,
    iconName: IconName.ShieldLock,
  },
  [TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE]: {
    labelKey: 'shieldManagePlan',
    parentPath: TRANSACTION_SHIELD_ROUTE,
    component: mmLazy(
      () => import('./transaction-shield-tab/manage-plan-sub-page.tsx'),
    ),
  },
  [TRANSACTION_SHIELD_MANAGE_PAST_PLAN_ROUTE]: {
    labelKey: 'shieldPastPlansTitle',
    parentPath: TRANSACTION_SHIELD_ROUTE,
    component: mmLazy(
      () => import('./transaction-shield-tab/manage-past-plan-sub-page.tsx'),
    ),
  },
  [TRANSACTION_SHIELD_CLAIM_ROUTES.BASE]: {
    labelKey: 'shieldClaimsListTitle',
    parentPath: TRANSACTION_SHIELD_ROUTE,
  },
  [TRANSACTION_SHIELD_CLAIMS_WILDCARD_ROUTE]: {
    labelKey: 'shieldClaimsListTitle',
    parentPath: TRANSACTION_SHIELD_ROUTE,
    component: mmLazy(
      () => import('../settings/transaction-shield-tab/claims-area/index.ts'),
    ),
  },
  [TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL]: {
    labelKey: 'shieldClaim',
    parentPath: TRANSACTION_SHIELD_CLAIM_ROUTES.BASE,
  },
  [TRANSACTION_SHIELD_EDIT_DRAFT_ROUTE]: {
    labelKey: 'shieldClaimsListTitle',
    parentPath: `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}?tab=${CLAIMS_TAB_KEYS.PENDING}`,
  },
  [TRANSACTION_SHIELD_VIEW_PENDING_ROUTE]: {
    labelKey: 'shieldClaimsListTitle',
    parentPath: `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}?tab=${CLAIMS_TAB_KEYS.PENDING}`,
  },
  [TRANSACTION_SHIELD_VIEW_HISTORY_ROUTE]: {
    labelKey: 'shieldClaimsListTitle',
    parentPath: `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}?tab=${CLAIMS_TAB_KEYS.HISTORY}`,
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

  // --- Debug (internal) tab ---
  ...(SHOW_DEBUG_SETTINGS
    ? {
        [DEVELOPER_OPTIONS_ROUTE]: {
          labelKey: 'debug',
          parentPath: SETTINGS_V2_ROUTE,
          component: mmLazy(() => import('./debug-tab/index.ts')),
          isTab: true,
          iconName: IconName.Sparkle,
        },
      }
    : {}),

  // --- Developer Tools tab ---
  [DEVELOPER_TOOLS_ROUTE]: {
    labelKey: 'developerTools',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./developer-tools-tab/index.ts')),
    isTab: true,
    iconName: IconName.Code,
  },

  // --- About tab ---
  [ABOUT_US_ROUTE]: {
    labelKey: 'aboutMetaMask',
    parentPath: SETTINGS_V2_ROUTE,
    component: mmLazy(() => import('./about-tab/index.ts')),
    isTab: true,
    iconName: IconName.Info,
  },

  // --- Snap settings (navigated via URL, not shown as a tab) ---
  [SNAP_SETTINGS_ROUTE]: {
    labelKey: 'snaps',
    parentPath: SETTINGS_V2_ROUTE,
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
  if (!pathname) {
    return null;
  }

  const exactMeta = SETTINGS_V2_ROUTES[pathname];
  if (exactMeta) {
    return exactMeta;
  }

  const matchingRoute = Object.keys(SETTINGS_V2_ROUTES)
    .filter((routePath) => routePath.includes('*') || routePath.includes(':'))
    .sort((routeA, routeB) => routeB.length - routeA.length)
    .find((routePath) =>
      Boolean(
        matchPath(
          {
            path: routePath,
            end: true,
          },
          pathname,
        ),
      ),
    );

  return matchingRoute ? SETTINGS_V2_ROUTES[matchingRoute] : null;
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
