import { useEffect, useMemo, useRef } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import { ApprovalType } from '@metamask/controller-utils';
import {
  AWAITING_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  CONNECT_ROUTE,
  DEFAULT_ROUTE,
  SEND_ROUTE,
} from '../../helpers/constants/routes';
import {
  selectPendingApprovalsForNavigation,
  getApprovalFlows,
} from '../../selectors';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  getBackgroundSwapRouteState,
  getFetchParams,
  getQuotes,
} from '../../ducks/swaps/swaps';
import { getConfirmationRoute } from '../../pages/confirmations/hooks/useConfirmationNavigation';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  SMART_TRANSACTION_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
import { useNavState } from '../../contexts/navigation-state';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';

export const ConfirmationHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const navState = useNavState();
  const isUnlocked = useSelector(getIsUnlocked);
  const isLocked = !isUnlocked;
  const pendingApprovals = useSelector(selectPendingApprovalsForNavigation);
  const approvalFlows = useSelector(getApprovalFlows);
  const swapsRouteState = useSelector(getBackgroundSwapRouteState);
  const swapsFetchParams = useSelector(getFetchParams);
  const swapsQuotes = useSelector(getQuotes, isEqual);
  const bridgeQuotes = useSelector(
    (state: { metamask: { quotes?: Record<string, unknown> } }) =>
      state.metamask.quotes,
    isEqual,
  );

  const windowType = getEnvironmentType();
  const isNotification = windowType === ENVIRONMENT_TYPE_NOTIFICATION;
  const isFullscreen = windowType === ENVIRONMENT_TYPE_FULLSCREEN;

  const lastPathname = useRef<string | null>(null);

  // Memoize derived values to prevent unnecessary effect runs
  const haveSwapsQuotes = useMemo(
    () => Boolean(swapsQuotes && Object.values(swapsQuotes).length > 0),
    [swapsQuotes],
  );
  const haveBridgeQuotes = useMemo(
    () => Boolean(bridgeQuotes && Object.values(bridgeQuotes).length > 0),
    [bridgeQuotes],
  );
  const showAwaitingSwapScreen = swapsRouteState === 'awaiting';
  const hasPendingConfirmations =
    pendingApprovals.length > 0 || approvalFlows?.length > 0;

  // Extracted from home.component.js checkStatusAndNavigate
  // Read stayOnHomePage from both v5 location.state and v5-compat navState
  const stayOnHomePage = useMemo(
    () =>
      Boolean(
        (location.state as { stayOnHomePage?: boolean })?.stayOnHomePage,
      ) || Boolean(navState?.stayOnHomePage),
    [location.state, navState],
  );

  // Check if smart transaction status page is for dapp-initiated transaction
  const isDappSmartTransactionStatusPage = useMemo(() => {
    const approval = pendingApprovals?.[0];
    if (
      approval?.type ===
      SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage
    ) {
      const requestState = approval.requestState as
        | { isDapp?: boolean }
        | undefined;
      return requestState?.isDapp === true;
    }
    return false;
  }, [pendingApprovals]);

  const canRedirect = useMemo(() => {
    if (stayOnHomePage) {
      return false;
    }
    // Block navigation in fullscreen ONLY for dapp-initiated smart transaction status pages
    if (isFullscreen && isDappSmartTransactionStatusPage) {
      return false;
    }

    return true;
  }, [stayOnHomePage, isFullscreen, isDappSmartTransactionStatusPage]);

  const isOnHomePage = location.pathname === DEFAULT_ROUTE;

  // Routes that are valid destinations from confirmation pages and should not trigger
  // automatic navigation back to confirmations (e.g., /send for editing transactions)
  const isOnExcludedRoute = useMemo(
    () => location.pathname.startsWith(SEND_ROUTE),
    [location.pathname],
  );

  const isOnConfirmationRoute = useMemo(
    () =>
      location.pathname.startsWith(CONFIRM_TRANSACTION_ROUTE) ||
      location.pathname.startsWith(CONFIRMATION_V_NEXT_ROUTE) ||
      location.pathname.startsWith(CONNECT_ROUTE),
    [location.pathname],
  );

  const currentConfirmationId = params.id;
  const targetConfirmationId = pendingApprovals?.[0]?.id;

  const isViewingPendingConfirmation = useMemo(
    () =>
      Boolean(
        currentConfirmationId &&
          targetConfirmationId &&
          pendingApprovals.some(
            (approval) => approval.id === currentConfirmationId,
          ),
      ),
    [currentConfirmationId, targetConfirmationId, pendingApprovals],
  );

  // Check if pending approval is for network operations that are handled in dialog windows
  const isNetworkOperationApproval = useMemo(
    () =>
      Boolean(
        pendingApprovals?.[0]?.type === ApprovalType.AddEthereumChain ||
          pendingApprovals?.[0]?.type === ApprovalType.SwitchEthereumChain,
      ),
    [pendingApprovals],
  );

  // Skip navigation for network operation approvals when on home page in fullscreen/popup/sidepanel windows
  const shouldSkipNetworkOperationNavigation = useMemo(
    () =>
      hasPendingConfirmations &&
      isOnHomePage &&
      isNetworkOperationApproval &&
      !isNotification,
    [
      hasPendingConfirmations,
      isOnHomePage,
      isNetworkOperationApproval,
      isNotification,
    ],
  );

  // Only navigate to confirmations if we have pending confirmations and we're not already
  // on a confirmation route or viewing a pending confirmation
  // Exclude routes that are valid destinations from confirmation pages (e.g., /send for editing)
  const shouldNavigateToConfirmation = useMemo(
    () =>
      hasPendingConfirmations &&
      !isOnConfirmationRoute &&
      !isViewingPendingConfirmation &&
      !isOnExcludedRoute,
    [
      hasPendingConfirmations,
      isOnConfirmationRoute,
      isViewingPendingConfirmation,
      isOnExcludedRoute,
    ],
  );

  useEffect(() => {
    if (isLocked || !canRedirect || shouldSkipNetworkOperationNavigation) {
      lastPathname.current = null;
      return;
    }

    // Extracted from home.component.js checkStatusAndNavigate
    // Handle swap/bridge redirects first
    if (showAwaitingSwapScreen) {
      const targetPathname = AWAITING_SWAP_ROUTE;

      if (location.pathname === targetPathname) {
        return;
      }

      navigate(targetPathname);
      lastPathname.current = targetPathname;
      return;
    }
    if (haveSwapsQuotes || swapsFetchParams) {
      const targetPathname = PREPARE_SWAP_ROUTE;

      if (location.pathname === targetPathname) {
        return;
      }

      navigate(targetPathname);
      lastPathname.current = targetPathname;
      return;
    }
    if (haveBridgeQuotes) {
      const targetPathname = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;

      if (location.pathname === targetPathname) {
        return;
      }

      navigate(targetPathname);
      lastPathname.current = targetPathname;
      return;
    }

    if (shouldNavigateToConfirmation) {
      const url = getConfirmationRoute(
        targetConfirmationId,
        pendingApprovals,
        Boolean(approvalFlows?.length),
        '', // queryString
      );

      if (url) {
        if (location.pathname === url) {
          return;
        }

        navigate(url, { replace: true });
        lastPathname.current = url;
      } else {
        lastPathname.current = null;
      }
    } else {
      lastPathname.current = null;
    }
  }, [
    approvalFlows,
    canRedirect,
    haveBridgeQuotes,
    haveSwapsQuotes,
    isLocked,
    location.pathname,
    navigate,
    pendingApprovals,
    shouldNavigateToConfirmation,
    shouldSkipNetworkOperationNavigation,
    showAwaitingSwapScreen,
    swapsFetchParams,
    targetConfirmationId,
  ]);

  return null;
};
