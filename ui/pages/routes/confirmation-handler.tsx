import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import {
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  ACCOUNT_LIST_PAGE_ROUTE,
  UNLOCK_ROUTE,
  CONNECT_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
} from '../../helpers/constants/routes';
import { getConfirmationRoute } from '../confirmations/hooks/useConfirmationNavigation';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
import {
  selectHasApprovalFlows,
  selectHasBridgeQuotes,
  selectPendingApprovalsForNavigation,
} from '../../selectors';
import {
  getFetchParams,
  selectHasSwapsQuotes,
  selectShowAwaitingSwapScreen,
} from '../../ducks/swaps/swaps';
import { useNavState } from '../../contexts/navigation-state';
import { useModalState } from '../../hooks/useModalState';

const EXEMPTED_ROUTES = [
  ACCOUNT_LIST_PAGE_ROUTE,
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  UNLOCK_ROUTE,
  CONNECT_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_NFT_ROUTE,
];

const SNAP_APPROVAL_TYPES = [
  'wallet_installSnapResult',
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ///: END:ONLY_INCLUDE_IF
];

export const ConfirmationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const navState = useNavState();
  const { closeModals } = useModalState();

  const envType = getEnvironmentType();
  const isFullscreen = envType === ENVIRONMENT_TYPE_FULLSCREEN;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  const showAwaitingSwapScreen = useSelector(selectShowAwaitingSwapScreen);
  const hasSwapsQuotes = useSelector(selectHasSwapsQuotes);
  const hasBridgeQuotes = useSelector(selectHasBridgeQuotes);
  const swapsFetchParams = useSelector(getFetchParams);
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const hasApprovalFlows = useSelector(selectHasApprovalFlows);

  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage =
    Boolean(location.state?.stayOnHomePage) ||
    Boolean(navState?.stayOnHomePage);

  const canRedirect = !isNotification && !stayOnHomePage;

  // Ported from home.component - checkStatusAndNavigate()
  const checkStatusAndNavigate = useCallback(() => {
    if (canRedirect && showAwaitingSwapScreen) {
      closeModals();
      navigate(AWAITING_SWAP_ROUTE);
    } else if (canRedirect && (hasSwapsQuotes || swapsFetchParams)) {
      closeModals();
      navigate(PREPARE_SWAP_ROUTE);
    } else if (canRedirect && hasBridgeQuotes) {
      closeModals();
      navigate(CROSS_CHAIN_SWAP_ROUTE + PREPARE_SWAP_ROUTE);
    } else if (pendingApprovals.length || hasApprovalFlows) {
      const url = getConfirmationRoute(
        pendingApprovals?.[0]?.id,
        pendingApprovals,
        hasApprovalFlows,
        '',
      );

      if (url) {
        closeModals();
        navigate(url, { replace: true });
      }
    }
  }, [
    canRedirect,
    closeModals,
    hasApprovalFlows,
    hasBridgeQuotes,
    hasSwapsQuotes,
    navigate,
    pendingApprovals,
    showAwaitingSwapScreen,
    swapsFetchParams,
  ]);

  const isExemptedRoute = EXEMPTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const hasAllowedPopupRedirectApprovals = pendingApprovals.some((approval) =>
    SNAP_APPROVAL_TYPES.includes(approval.type),
  );

  // Check if there are swap-related navigation needs
  const hasSwapRelatedNavigation =
    showAwaitingSwapScreen ||
    hasSwapsQuotes ||
    swapsFetchParams ||
    hasBridgeQuotes;

  useEffect(() => {
    if (isExemptedRoute) {
      return;
    }

    if (
      isFullscreen &&
      !hasAllowedPopupRedirectApprovals &&
      !hasSwapRelatedNavigation
    ) {
      return;
    }

    checkStatusAndNavigate();
  }, [
    checkStatusAndNavigate,
    hasAllowedPopupRedirectApprovals,
    hasSwapRelatedNavigation,
    isExemptedRoute,
    isFullscreen,
  ]);

  return null;
};
