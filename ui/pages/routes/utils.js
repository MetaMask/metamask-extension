import { matchPath } from 'react-router-dom-v5-compat';
import { safeMatchPath } from '../../utils/safeRouteMatching';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import { ThemeType } from '../../../shared/constants/preferences';
import {
  ASSET_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  CONNECTIONS,
  CROSS_CHAIN_SWAP_ROUTE,
  IMPORT_SRP_ROUTE,
  DEFAULT_ROUTE,
  NOTIFICATIONS_ROUTE,
  ONBOARDING_ROUTE,
  PERMISSIONS,
  REVIEW_PERMISSIONS,
  SEND_ROUTE,
  SNAPS_VIEW_ROUTE,
  DEEP_LINK_ROUTE,
  WALLET_DETAILS_ROUTE,
  ACCOUNT_DETAILS_ROUTE,
  ACCOUNT_DETAILS_QR_CODE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
  SHIELD_PLAN_ROUTE,
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  GATOR_PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
} from '../../helpers/constants/routes';

/**
 * Helper function to safely get pathname from location object.
 *
 * This function is necessary because react-router-dom-v5-compat can sometimes
 * provide location objects where pathname is undefined, especially during:
 * - Initial app load before router is fully initialized
 * - Route transitions in HashRouter
 * - Component mounting before navigation state is established
 *
 * When pathname is undefined and passed to matchPath(), it causes the error:
 * "Cannot read properties of undefined (reading 'match')" because matchPath
 * internally calls pathname.match() on the provided pathname parameter.
 *
 * @param {object} location - The location object from useLocation() hook
 * @param {string|undefined|null} location.pathname - The current pathname (may be undefined or null)
 * @returns {string} Safe pathname string, defaults to '/' if undefined or null
 */
export function getSafePathname(location) {
  if (!location || typeof location.pathname !== 'string') {
    return '/';
  }
  return location.pathname;
}

export function isConfirmTransactionRoute(pathname) {
  return Boolean(
    safeMatchPath({ path: CONFIRM_TRANSACTION_ROUTE, end: false }, pathname),
  );
}

function getThemeFromRawTheme(theme) {
  if (theme === ThemeType.os) {
    if (window?.matchMedia('(prefers-color-scheme: dark)')?.matches) {
      return ThemeType.dark;
    }
    return ThemeType.light;
  }
  return theme;
}

export function setTheme(theme) {
  document.documentElement.setAttribute(
    'data-theme',
    getThemeFromRawTheme(theme),
  );
}

function onConfirmPage(props) {
  const { location } = props;
  const pathname = getSafePathname(location);
  return Boolean(
    matchPath({ path: CONFIRM_TRANSACTION_ROUTE, end: false }, pathname),
  );
}

export function getConnectingLabel(loadingMessage, props, context) {
  if (loadingMessage) {
    return loadingMessage;
  }
  const { providerType, providerId } = props;
  const { t } = context;

  switch (providerType) {
    case NETWORK_TYPES.MAINNET:
      return t('connectingToMainnet');
    case NETWORK_TYPES.GOERLI:
      return t('connectingToGoerli');
    case NETWORK_TYPES.SEPOLIA:
      return t('connectingToSepolia');
    case NETWORK_TYPES.LINEA_GOERLI:
      return t('connectingToLineaGoerli');
    case NETWORK_TYPES.LINEA_SEPOLIA:
      return t('connectingToLineaSepolia');
    case NETWORK_TYPES.LINEA_MAINNET:
      return t('connectingToLineaMainnet');
    default:
      return t('connectingTo', [providerId]);
  }
}

export function hideAppHeader(props) {
  const { location } = props;
  const pathname = getSafePathname(location);

  const isNotificationsPage = Boolean(
    matchPath({ path: NOTIFICATIONS_ROUTE, end: false }, pathname),
  );

  if (isNotificationsPage) {
    return true;
  }

  const isDeepLinksPage = Boolean(
    matchPath({ path: DEEP_LINK_ROUTE, end: false }, pathname),
  );

  if (isDeepLinksPage) {
    return true;
  }

  const isInitializing = Boolean(
    matchPath({ path: `${ONBOARDING_ROUTE}/*` }, pathname),
  );

  if (isInitializing) {
    return true;
  }

  const windowType = getEnvironmentType();

  if (windowType === ENVIRONMENT_TYPE_NOTIFICATION) {
    return true;
  }

  const isPermissionsPage = Boolean(
    matchPath({ path: PERMISSIONS, end: false }, pathname),
  );

  if (isPermissionsPage) {
    return true;
  }

  const isConnectionsPage = Boolean(
    matchPath({ path: CONNECTIONS, end: false }, pathname),
  );

  if (isConnectionsPage) {
    return true;
  }

  const isReviewPermissionsPgae = Boolean(
    matchPath({ path: REVIEW_PERMISSIONS, end: false }, pathname),
  );

  if (isReviewPermissionsPgae) {
    return true;
  }

  if (windowType === ENVIRONMENT_TYPE_POPUP && onConfirmPage(props)) {
    return true;
  }

  const isHandlingPermissionsRequest = Boolean(
    matchPath({ path: CONNECT_ROUTE, end: false }, pathname),
  );

  const isMultichainSend = Boolean(
    matchPath({ path: SEND_ROUTE, end: false }, pathname),
  );
  if (isMultichainSend) {
    return true;
  }

  const isStateTwoMultichainAccountDetailsPage = Boolean(
    matchPath(
      { path: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE, end: false },
      pathname,
    ),
  );
  if (isStateTwoMultichainAccountDetailsPage) {
    return true;
  }

  const isStateTwoMultichainWalletDetailsPage = Boolean(
    matchPath(
      { path: MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE, end: false },
      pathname,
    ),
  );
  if (isStateTwoMultichainWalletDetailsPage) {
    return true;
  }

  const isWalletDetailsPage = Boolean(
    matchPath({ path: WALLET_DETAILS_ROUTE, end: false }, pathname),
  );
  if (isWalletDetailsPage) {
    return true;
  }

  const isSnapsHome = Boolean(
    matchPath({ path: SNAPS_VIEW_ROUTE, end: false }, pathname),
  );
  if (isSnapsHome) {
    return true;
  }

  const isCrossChainSwapsPage = Boolean(
    matchPath({ path: CROSS_CHAIN_SWAP_ROUTE, end: false }, pathname),
  );
  if (isCrossChainSwapsPage) {
    return true;
  }

  const isAssetsPage = Boolean(
    matchPath({ path: ASSET_ROUTE, end: false }, pathname),
  );

  if (isAssetsPage) {
    return true;
  }

  const isMultichainAccountDetailsPage = Boolean(
    matchPath({ path: ACCOUNT_DETAILS_ROUTE, end: false }, pathname),
  );

  if (isMultichainAccountDetailsPage) {
    return true;
  }

  const isMultichainAccountDetailsQRCodePage = Boolean(
    matchPath({ path: ACCOUNT_DETAILS_QR_CODE_ROUTE, end: false }, pathname),
  );

  if (isMultichainAccountDetailsQRCodePage) {
    return true;
  }

  const isHandlingAddEthereumChainRequest = Boolean(
    matchPath({ path: CONFIRMATION_V_NEXT_ROUTE, end: false }, pathname),
  );

  const isImportSrpPage = Boolean(
    matchPath({ path: IMPORT_SRP_ROUTE, end: false }, pathname),
  );

  const isShieldPlanPage = Boolean(
    matchPath({ path: SHIELD_PLAN_ROUTE, end: false }, pathname),
  );

  if (isShieldPlanPage) {
    return true;
  }

  const isGatorPermissionsPage = Boolean(
    matchPath({ path: GATOR_PERMISSIONS, end: false }, pathname),
  );

  if (isGatorPermissionsPage) {
    return true;
  }

  const isGatorPermissionsTokenTransferPage = Boolean(
    matchPath({ path: TOKEN_TRANSFER_ROUTE, end: false }, pathname),
  );

  if (isGatorPermissionsTokenTransferPage) {
    return true;
  }

  const isReviewGatorPermissionsPage = Boolean(
    matchPath({ path: REVIEW_GATOR_PERMISSIONS_ROUTE, end: false }, pathname),
  );

  if (isReviewGatorPermissionsPage) {
    return true;
  }

  return (
    isHandlingPermissionsRequest ||
    isHandlingAddEthereumChainRequest ||
    isConfirmTransactionRoute(pathname) ||
    isImportSrpPage
  );
}

export function showAppHeader(props) {
  const { location } = props;
  const pathname = getSafePathname(location);
  return Boolean(
    matchPath(
      {
        path: DEFAULT_ROUTE,
        exact: true,
      },
      pathname,
    ),
  );
}
