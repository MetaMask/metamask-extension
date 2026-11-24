import { matchPath } from 'react-router-dom';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  ACTIVITY_ROUTE,
  ASSET_ACTIVATION_LOADER_ROUTE,
  ASSET_DETAILS_ROUTE,
  ASSET_IMAGE_ROUTE,
  ASSET_SECURITY_TRUST_ROUTE,
  DEFAULT_ROUTE,
  LEGACY_SETTINGS_V2_ROUTE,
  MFA_SETTINGS_EMAIL_ROUTE,
  MFA_SETTINGS_TOTP_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  MONEY_EARN_ROUTE,
  MONEY_HOME_ROUTE,
  MONEY_HOW_IT_WORKS_ROUTE,
  NOTIFICATIONS_ROUTE,
  PERPS_ACTIVITY_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
  PERPS_TRANSACTION_DETAILS_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES,
  TX_DETAILS_ROUTE,
} from '../../../helpers/constants/routes';

/**
 * Screens where an update reloads nothing the user has entered. Trade, send,
 * swap, and other in-progress routes are absent on purpose: the takeover
 * waits until the user reaches one of these.
 */
const RESTING_ROUTE_PATTERNS: { path: string; end: boolean }[] = [
  { path: DEFAULT_ROUTE, end: true },
  { path: ACTIVITY_ROUTE, end: true },
  { path: `${TX_DETAILS_ROUTE}/:caipChainId/:txIdentifier`, end: true },
  { path: ASSET_DETAILS_ROUTE, end: true },
  { path: ASSET_SECURITY_TRUST_ROUTE, end: true },
  { path: ASSET_IMAGE_ROUTE, end: true },
  { path: SETTINGS_ROUTE, end: false },
  { path: LEGACY_SETTINGS_V2_ROUTE, end: false },
  { path: ACCOUNT_LIST_PAGE_ROUTE, end: true },
  { path: NOTIFICATIONS_ROUTE, end: true },
  { path: `${NOTIFICATIONS_ROUTE}/:uuid`, end: true },
  { path: PERPS_HOME_PAGE_ROUTE, end: true },
  { path: `${PERPS_MARKET_DETAIL_ROUTE}/:symbol`, end: true },
  { path: PERPS_MARKET_LIST_ROUTE, end: true },
  { path: PERPS_ACTIVITY_ROUTE, end: true },
  { path: PERPS_TRANSACTION_DETAILS_ROUTE, end: true },
  { path: MONEY_HOME_ROUTE, end: true },
  { path: MONEY_ACTIVITY_ROUTE, end: false },
  { path: MONEY_HOW_IT_WORKS_ROUTE, end: true },
  { path: MONEY_EARN_ROUTE, end: true },
];

/**
 * Routes that match a resting pattern above but hold a flow in progress: the
 * asset-activation loader shares the asset path shape, and these settings
 * screens are forms.
 */
const NON_RESTING_ROUTES = [
  ASSET_ACTIVATION_LOADER_ROUTE,
  SECURITY_PASSWORD_CHANGE_V2_ROUTE,
  SECURITY_REGISTER_PASSKEY_ROUTE,
  MFA_SETTINGS_EMAIL_ROUTE,
  MFA_SETTINGS_TOTP_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL,
  TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL,
];

/**
 * Returns whether the takeover may cover this pathname.
 *
 * @param pathname - Location pathname, without the hash or search.
 * @returns Whether the pathname is a resting screen.
 */
export function isExtensionUpdateRestingPathname(pathname: string): boolean {
  if (NON_RESTING_ROUTES.some((route) => matchPath(route, pathname) !== null)) {
    return false;
  }

  return RESTING_ROUTE_PATTERNS.some(
    (pattern) => matchPath(pattern, pathname) !== null,
  );
}
