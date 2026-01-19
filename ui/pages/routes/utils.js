import { matchPath } from 'react-router-dom';
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
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
  SHIELD_PLAN_ROUTE,
  MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
  GATOR_PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
  REVIEW_GATOR_PERMISSIONS_ROUTE,
} from '../../helpers/constants/routes';

export function isConfirmTransactionRoute(pathname) {
  return Boolean(
    matchPath(
      {
        path: CONFIRM_TRANSACTION_ROUTE,
        end: false,
      },
      pathname,
    ),
  );
}

export function getThemeFromRawTheme(theme) {
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
  return Boolean(
    matchPath(
      {
        path: CONFIRM_TRANSACTION_ROUTE,
        end: false,
      },
      location.pathname,
    ),
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

  const isNotificationsPage = Boolean(
    matchPath(
      {
        path: `${NOTIFICATIONS_ROUTE}`,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isNotificationsPage) {
    return true;
  }

  const isDeepLinksPage = Boolean(
    matchPath(
      {
        path: DEEP_LINK_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isDeepLinksPage) {
    return true;
  }

  const isInitializing = Boolean(
    matchPath(
      {
        path: ONBOARDING_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isInitializing) {
    return true;
  }

  const windowType = getEnvironmentType();

  if (windowType === ENVIRONMENT_TYPE_NOTIFICATION) {
    return true;
  }

  const isPermissionsPage = Boolean(
    matchPath(
      {
        path: PERMISSIONS,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isPermissionsPage) {
    return true;
  }

  const isReviewPermissionsPgae = Boolean(
    matchPath(
      {
        path: REVIEW_PERMISSIONS,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isReviewPermissionsPgae) {
    return true;
  }

  if (windowType === ENVIRONMENT_TYPE_POPUP && onConfirmPage(props)) {
    return true;
  }

  const isHandlingPermissionsRequest = Boolean(
    matchPath(
      {
        path: CONNECT_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  const isMultichainSend = Boolean(
    matchPath(
      {
        path: SEND_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );
  if (isMultichainSend) {
    return true;
  }

  const isStateTwoMultichainAccountDetailsPage = Boolean(
    matchPath(
      {
        path: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );
  if (isStateTwoMultichainAccountDetailsPage) {
    return true;
  }

  const isStateTwoMultichainWalletDetailsPage = Boolean(
    matchPath(
      {
        path: MULTICHAIN_WALLET_DETAILS_PAGE_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );
  if (isStateTwoMultichainWalletDetailsPage) {
    return true;
  }

  const isSnapsHome = Boolean(
    matchPath(
      {
        path: SNAPS_VIEW_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );
  if (isSnapsHome) {
    return true;
  }

  const isCrossChainSwapsPage = Boolean(
    matchPath(
      {
        path: `${CROSS_CHAIN_SWAP_ROUTE}`,
        end: false,
      },
      location.pathname,
    ),
  );
  if (isCrossChainSwapsPage) {
    return true;
  }

  const isAssetsPage = Boolean(
    matchPath(
      {
        path: ASSET_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isAssetsPage) {
    return true;
  }

  const isHandlingAddEthereumChainRequest = Boolean(
    matchPath(
      {
        path: CONFIRMATION_V_NEXT_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  const isImportSrpPage = Boolean(
    matchPath(
      {
        path: IMPORT_SRP_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  const isShieldPlanPage = Boolean(
    matchPath(
      {
        path: SHIELD_PLAN_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isShieldPlanPage) {
    return true;
  }

  const isGatorPermissionsPage = Boolean(
    matchPath(
      {
        path: GATOR_PERMISSIONS,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isGatorPermissionsPage) {
    return true;
  }

  const isGatorPermissionsTokenTransferPage = Boolean(
    matchPath(
      {
        path: TOKEN_TRANSFER_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isGatorPermissionsTokenTransferPage) {
    return true;
  }

  const isReviewGatorPermissionsPage = Boolean(
    matchPath(
      {
        path: REVIEW_GATOR_PERMISSIONS_ROUTE,
        end: false,
      },
      location.pathname,
    ),
  );

  if (isReviewGatorPermissionsPage) {
    return true;
  }

  return (
    isHandlingPermissionsRequest ||
    isHandlingAddEthereumChainRequest ||
    isConfirmTransactionRoute(location.pathname) ||
    isImportSrpPage
  );
}

export function showAppHeader(props) {
  const { location } = props;
  return Boolean(
    matchPath(
      {
        path: DEFAULT_ROUTE,
        end: true,
      },
      location.pathname,
    ),
  );
}

/**
 * Creates a relative location object for use with nested react-router-dom Routes.
 *
 * When using <Routes> and <Route> components inside a parent route,
 * the child Routes need to match against paths relative to the parent route,
 * not the full pathname. This function strips the base path prefix from the
 * location to create a relative location. The resulting pathname is guaranteed
 * to start with '/', as required by React Router Route matching.
 *
 * @param {object} location - The full location object from react-router
 * @param {string} location.pathname - The full pathname (e.g., '/connect/id/snap-install')
 * @param {string} basePath - The base path to remove (e.g., '/connect/id' or '/connect/id/')
 * @returns {object} A new location object with pathname set to the relative path
 * (e.g., '/snap-install' or '/') and all other location properties preserved
 * @example
 * // Full pathname: '/connect/abc123/snaps-connect'
 * // Base path: '/connect/abc123' or '/connect/abc123/'
 * const relativeLocation = getRelativeLocationForNestedRoutes(
 *   location,
 *   '/connect/abc123'
 * );
 * // relativeLocation.pathname === '/snaps-connect'
 * @example
 * // Usage with v6 Routes:
 * <Routes location={relativeLocation}>
 *   <Route path="/" element={<HomePage />} />
 *   <Route path="/snaps-connect" element={<SnapsConnect />} />
 * </Routes>
 */
export function getRelativeLocationForNestedRoutes(location, basePath) {
  const normalizedBasePath = basePath.endsWith('/')
    ? basePath.slice(0, -1)
    : basePath;

  const relativePathname = location.pathname.startsWith(normalizedBasePath)
    ? location.pathname.slice(normalizedBasePath.length) || '/'
    : location.pathname;

  return {
    ...location,
    pathname: relativePathname,
  };
}

/**
 * Converts an absolute route path to a relative path for use with nested Routes.
 *
 * When using nested `<Routes>` components inside a parent route with `/*`,
 * child routes need to use relative paths (without the parent's base path prefix).
 * This function strips the base path and leading slash to create a truly relative path.
 *
 * @param {string} absolutePath - The full absolute path (e.g., '/onboarding/completion')
 * @param {string} [basePath] - The base path to remove (e.g., '/onboarding'). Defaults to empty string.
 * @returns {string} The relative path suitable for nested Route matching
 * (e.g., 'completion' or '/' for the base route)
 */
export function toRelativeRoutePath(absolutePath, basePath = '') {
  const relativePath = absolutePath.replace(basePath, '').replace(/^\//u, '');
  return relativePath || '/';
}

/**
 * Extracts the transaction ID from a URL pathname.
 *
 * @param {string} pathname - The URL pathname (e.g., '/confirm-transaction/123?query=foo').
 * @param {string} baseRoute - The base route to match against (e.g., '/confirm-transaction/').
 * @returns {string | null} The transaction ID if found, otherwise null.
 * @example
 * extractIdFromPathname('/confirm-transaction/abc123', '/confirm-transaction/') // 'abc123'
 * extractIdFromPathname('/confirm-transaction/abc123?foo=bar', '/confirm-transaction/') // 'abc123'
 * extractIdFromPathname('/confirm-transaction/abc123#hash', '/confirm-transaction/') // 'abc123'
 * extractIdFromPathname('/other-route', '/confirm-transaction/') // null
 */
export function extractIdFromPathname(pathname, baseRoute) {
  if (!pathname || !baseRoute || !pathname.includes(baseRoute)) {
    return null;
  }

  // Get the part after the base route
  const afterRoute = pathname.split(baseRoute)[1];

  if (!afterRoute) {
    return null;
  }

  // Extract the ID by getting everything before any query params or hash
  const id = afterRoute.split(/[/?#]/u)[0];

  return id || null;
}
