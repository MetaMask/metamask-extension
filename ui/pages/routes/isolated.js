import { matchPath } from 'react-router-dom';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import { ThemeType } from '../../../shared/constants/preferences';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  CONNECTIONS,
  NOTIFICATIONS_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  PERMISSIONS,
  REVIEW_PERMISSIONS,
  SEND_ROUTE,
  SNAPS_VIEW_ROUTE,
  SWAPS_ROUTE,
} from '../../helpers/constants/routes';

export function isConfirmTransactionRoute(pathname) {
  return Boolean(
    matchPath(pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
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

export function onSwapsPage() {
  const { location } = this.props;
  return Boolean(
    matchPath(location.pathname, { path: SWAPS_ROUTE, exact: false }),
  );
}

export function onConfirmPage() {
  const { location } = this.props;
  return Boolean(
    matchPath(location.pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
  );
}

export function onInitializationUnlockPage() {
  const { location } = this.props;
  return Boolean(
    matchPath(location.pathname, {
      path: ONBOARDING_UNLOCK_ROUTE,
      exact: true,
    }),
  );
}

export function showOnboardingHeader(location) {
  return Boolean(
    matchPath(location.pathname, {
      path: ONBOARDING_ROUTE,
      exact: false,
    }),
  );
}

export function toggleMetamaskActive() {
  if (this.props.isUnlocked) {
    // currently active: deactivate
    this.props.lockMetaMask();
  } else {
    // currently inactive: redirect to password box
    const passwordBox = document.querySelector('input[type=password]');
    if (!passwordBox) {
      return;
    }
    passwordBox.focus();
  }
}

export function getConnectingLabel(loadingMessage) {
  if (loadingMessage) {
    return loadingMessage;
  }
  const { providerType, providerId } = this.props;
  const { t } = this.context;

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

  const isInitializing = Boolean(
    matchPath(location.pathname, {
      path: ONBOARDING_ROUTE,
      exact: false,
    }),
  );

  if (isInitializing && !this.onInitializationUnlockPage()) {
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

  if (windowType === ENVIRONMENT_TYPE_POPUP && this.onConfirmPage()) {
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

  const isSnapsHome = Boolean(
    matchPath(location.pathname, {
      path: SNAPS_VIEW_ROUTE,
      exact: false,
    }),
  );
  if (isSnapsHome) {
    return true;
  }

  const isHandlingAddEthereumChainRequest = Boolean(
    matchPath(location.pathname, {
      path: CONFIRMATION_V_NEXT_ROUTE,
      exact: false,
    }),
  );

  return (
    isHandlingPermissionsRequest ||
    isHandlingAddEthereumChainRequest ||
    isConfirmTransactionRoute(location.pathname)
  );
}

export function getShowAutoNetworkSwitchTest(props) {
  return props.switchedNetworkDetails && !props.neverShowSwitchedNetworkMessage;
}
