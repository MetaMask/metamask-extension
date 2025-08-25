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
} from '../../helpers/constants/routes';

export function isConfirmTransactionRoute(pathname) {
  return Boolean(
    matchPath(pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
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
  return Boolean(
    matchPath(location.pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
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
    matchPath(location.pathname, {
      path: `${NOTIFICATIONS_ROUTE}`,
      exact: false,
    }),
  );

  if (isNotificationsPage) {
    return true;
  }

  const isDeepLinksPage = Boolean(
    matchPath(location.pathname, {
      path: DEEP_LINK_ROUTE,
      exact: false,
    }),
  );

  if (isDeepLinksPage) {
    return true;
  }

  const isInitializing = Boolean(
    matchPath(location.pathname, {
      path: ONBOARDING_ROUTE,
      exact: false,
    }),
  );

  if (isInitializing) {
    return true;
  }

  const windowType = getEnvironmentType();

  if (windowType === ENVIRONMENT_TYPE_NOTIFICATION) {
    return true;
  }

  const isPermissionsPage = Boolean(
    matchPath(location.pathname, {
      path: PERMISSIONS,
      exact: false,
    }),
  );

  if (isPermissionsPage) {
    return true;
  }

  const isConnectionsPage = Boolean(
    matchPath(location.pathname, {
      path: CONNECTIONS,
      exact: false,
    }),
  );

  if (isConnectionsPage) {
    return true;
  }

  const isReviewPermissionsPgae = Boolean(
    matchPath(location.pathname, {
      path: REVIEW_PERMISSIONS,
      exact: false,
    }),
  );

  if (isReviewPermissionsPgae) {
    return true;
  }

  if (windowType === ENVIRONMENT_TYPE_POPUP && onConfirmPage(props)) {
    return true;
  }

  const isHandlingPermissionsRequest = Boolean(
    matchPath(location.pathname, {
      path: CONNECT_ROUTE,
      exact: false,
    }),
  );

  const isMultichainSend = Boolean(
    matchPath(location.pathname, {
      path: SEND_ROUTE,
      exact: false,
    }),
  );
  if (isMultichainSend) {
    return true;
  }

  const isStateTwoMultichainAccountDetailsPage = Boolean(
    matchPath(location.pathname, {
      path: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
      exact: false,
    }),
  );
  if (isStateTwoMultichainAccountDetailsPage) {
    return true;
  }

  const isWalletDetailsPage = Boolean(
    matchPath(location.pathname, {
      path: WALLET_DETAILS_ROUTE,
      exact: false,
    }),
  );
  if (isWalletDetailsPage) {
    return true;
  }

  const isSnapsHome = Boolean(
    matchPath(location.pathname, {
      path: SNAPS_VIEW_ROUTE,
      exact: false,
    }),
  );
  if (isSnapsHome) {
    return true;
  }

  const isCrossChainSwapsPage = Boolean(
    matchPath(location.pathname, {
      path: `${CROSS_CHAIN_SWAP_ROUTE}`,
      exact: false,
    }),
  );
  if (isCrossChainSwapsPage) {
    return true;
  }

  const isAssetsPage = Boolean(
    matchPath(location.pathname, {
      path: ASSET_ROUTE,
      exact: false,
    }),
  );

  if (isAssetsPage) {
    return true;
  }

  const isMultichainAccountDetailsPage = Boolean(
    matchPath(location.pathname, {
      path: ACCOUNT_DETAILS_ROUTE,
      exact: false,
    }),
  );

  if (isMultichainAccountDetailsPage) {
    return true;
  }

  const isMultichainAccountDetailsQRCodePage = Boolean(
    matchPath(location.pathname, {
      path: ACCOUNT_DETAILS_QR_CODE_ROUTE,
      exact: false,
    }),
  );

  if (isMultichainAccountDetailsQRCodePage) {
    return true;
  }

  const isHandlingAddEthereumChainRequest = Boolean(
    matchPath(location.pathname, {
      path: CONFIRMATION_V_NEXT_ROUTE,
      exact: false,
    }),
  );

  const isImportSrpPage = Boolean(
    matchPath(location.pathname, {
      path: IMPORT_SRP_ROUTE,
      exact: false,
    }),
  );

  const isShieldPlanPage = Boolean(
    matchPath(location.pathname, {
      path: SHIELD_PLAN_ROUTE,
      exact: false,
    }),
  );

  if (isShieldPlanPage) {
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
    matchPath(location.pathname, {
      path: DEFAULT_ROUTE,
      exact: true,
    }),
  );
}
