import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import {
  getUseExternalServices,
  getTotalUnapprovedCount,
  getIsSigningQRHardwareTransaction,
  getIsHardwareWalletErrorModalVisible,
  getApprovalFlows,
  hasPendingApprovals,
  getPendingRedirectRoute,
  getLastVisitedPerpsRoute,
} from '../../selectors';
import {
  attemptCloseNotificationPopup,
  lookupSelectedNetworks,
  setPendingRedirectRoute,
  setLastVisitedPerpsRoute,
} from '../../store/actions';
import { openBasicFunctionalityModal } from '../../ducks/app/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  getRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
  setRedirectAfterDefaultPage,
} from '../../ducks/history/history';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
import { AppHeader } from '../../components/multichain/app-header';
import { DappConnectionControlBar } from '../../components/multichain/dapp-connection-control-bar';
import { MetaMaskReduxState } from '../../store/store';
import Home from './home.component';

function useCoreHomeState() {
  const forgottenPassword = useSelector(
    (state: MetaMaskReduxState) => state.metamask.forgottenPassword,
  );

  return { forgottenPassword };
}

function useNetworkState() {
  const useExternalServices = useSelector(getUseExternalServices);
  return { useExternalServices };
}

function useNotificationState() {
  const isNotification = getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION;
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const hasApprovalFlows = useSelector(
    (state: MetaMaskReduxState) => (getApprovalFlows(state)?.length ?? 0) > 0,
  );
  // hasAllowedPopupRedirectApprovals drives routing within the notification
  // popup — kept here so it can be wired in once the route guard logic moves
  // to Home.
  const hasAllowedPopupRedirectApprovals = useSelector(
    (state: MetaMaskReduxState) =>
      hasPendingApprovals(state, [
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation as ApprovalType,
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval as ApprovalType,
        SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect as ApprovalType,
      ]),
  );
  const isSigningQRHardwareTransaction = useSelector(
    getIsSigningQRHardwareTransaction,
  );
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  // Pre-compute so Home only needs a single boolean, keeping its prop surface
  // smaller (1 vs 5 individual values).
  const notificationClosing =
    isNotification &&
    totalUnapprovedCount === 0 &&
    !hasApprovalFlows &&
    !isSigningQRHardwareTransaction &&
    !isHardwareWalletErrorModalVisible;

  return {
    notificationClosing,
    hasAllowedPopupRedirectApprovals,
  };
}

function useAppUIState() {
  const envType = getEnvironmentType();
  return { envType };
}

function useRedirectState() {
  const pendingRedirectRoute = useSelector(getPendingRedirectRoute);
  const lastVisitedPerpsRoute = useSelector(getLastVisitedPerpsRoute);
  const redirectAfterDefaultPage = useSelector(getRedirectAfterDefaultPage);

  return {
    pendingRedirectRoute,
    lastVisitedPerpsRoute,
    redirectAfterDefaultPage,
  };
}

function useHomeActions() {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      // Not dispatched — calls background directly
      attemptCloseNotificationPopup: () => attemptCloseNotificationPopup(),
      setBasicFunctionalityModalOpen: () =>
        dispatch(openBasicFunctionalityModal()),
      setRedirectAfterDefaultPage: (redirect: object) =>
        dispatch(setRedirectAfterDefaultPage(redirect)),
      clearRedirectAfterDefaultPage: () =>
        dispatch(clearRedirectAfterDefaultPage()),
      lookupSelectedNetworks: () => dispatch(lookupSelectedNetworks()),
      clearPendingRedirectRoute: () => dispatch(setPendingRedirectRoute(null)),
      clearLastVisitedPerpsRoute: () =>
        dispatch(setLastVisitedPerpsRoute(null)),
    }),
    [dispatch],
  );
}

export default function HomeContainer() {
  const navigate = useNavigate();
  const location = useLocation();

  const coreState = useCoreHomeState();
  const networkState = useNetworkState();
  const notificationState = useNotificationState();
  const appUIState = useAppUIState();
  const redirectState = useRedirectState();
  const actions = useHomeActions();

  return (
    <>
      <AppHeader />
      <div className="flex flex-col flex-1 min-h-0">
        <Home
          {...coreState}
          {...networkState}
          {...notificationState}
          {...appUIState}
          {...redirectState}
          {...actions}
          navigate={navigate}
          location={location}
        />
        <DappConnectionControlBar />
      </div>
    </>
  );
}
