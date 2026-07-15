import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../shared/constants/app';
import { isBeta, isFlask, isMain } from '../../../shared/lib/build-types';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { TermsOfUsePopupContainer } from '../../components/app/terms-of-use-popup';
import { MetaMetricsConsentContainer } from '../../components/app/metametrics-consent/metametrics-consent-container';
import { RecoveryPhraseReminderContainer } from '../../components/app/recovery-phrase-reminder';
import { ImportedTokensNotificationContainer } from '../../components/app/imported-tokens-notification/imported-tokens-notification-container';
import { MultiRpcEditModalContainer } from '../../components/app/multi-rpc-edit-modal/multi-rpc-edit-modal-container';
import { UpdateModalContainer } from '../../components/app/update-modal/update-modal-container';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import ConnectedSites from '../connected-sites';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import ConnectedAccounts from '../connected-accounts';
import { ScrollContainer } from '../../contexts/scroll-container';
import {
  RESTORE_VAULT_ROUTE,
  CONNECTED_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
} from '../../helpers/constants/routes';
import { AccountOverview } from '../../components/multichain';
import { PasswordOutdatedModalContainer } from '../../components/app/password-outdated-modal';
import { ShieldEntryModalContainer } from '../../components/app/shield-entry-modal';
import { RewardsModalContainer } from '../../components/app/rewards/onboarding/rewards-modal-container';
import { Pna25ModalContainer } from '../../components/app/modals/pna25-modal/pna25-modal-container';
import { AppHeader } from '../../components/multichain/app-header';
import { DappConnectionControlBar } from '../../components/multichain/dapp-connection-control-bar';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useSegmentContext } from '../../hooks/useSegmentContext';
import { openBasicFunctionalityModal } from '../../ducks/app/app';
import {
  getRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
  setRedirectAfterDefaultPage,
} from '../../ducks/history/history';
import {
  getUseExternalServices,
  getTotalUnapprovedCount,
  getIsSigningQRHardwareTransaction,
  getIsHardwareWalletErrorModalVisible,
  getApprovalFlows,
  getPendingRedirectRoute,
  getLastVisitedPerpsRoute,
} from '../../selectors';
import {
  attemptCloseNotificationPopup,
  lookupSelectedNetworks,
  setPendingRedirectRoute,
  setLastVisitedPerpsRoute,
} from '../../store/actions';
import { MetaMaskReduxState } from '../../store/store';
import { ConnectedStatusPopoverContainer } from './connected-status-popover-container';
import { DeeplinkQrCodeModalContainer } from './deeplink-qrcode-modal-container';
import { ShieldCohortContainer } from './shield-cohort-container';
import { HomeNotificationsContainer } from './home-notifications-container';
import BetaAndFlaskHomeFooter from './beta-and-flask-home-footer.component';
import { HomeDeepLinkActions } from './HomeDeepLinkActions';
import {
  useLastVisitedPerpsRoute,
  usePendingRedirectRoute,
  useRedirectAfterDefaultPage,
} from './useHomeRedirects';

/** Survives StrictMode remounts within the same extension session. */
let hasLookupSelectedNetworksRun = false;

/** @internal */
export function resetLookupSelectedNetworksForTesting(): void {
  hasLookupSelectedNetworksRun = false;
}

function useHomeState() {
  const forgottenPassword = useSelector(
    (state: MetaMaskReduxState) => state.metamask.forgottenPassword,
  );
  const useExternalServices = useSelector(getUseExternalServices);
  const envType = getEnvironmentType();
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const hasApprovalFlows = useSelector(
    (state: MetaMaskReduxState) => (getApprovalFlows(state)?.length ?? 0) > 0,
  );
  const isSigningQRHardwareTransaction = useSelector(
    getIsSigningQRHardwareTransaction,
  );
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );
  const pendingRedirectRoute = useSelector(getPendingRedirectRoute);
  const lastVisitedPerpsRoute = useSelector(getLastVisitedPerpsRoute);
  const redirectAfterDefaultPage = useSelector(getRedirectAfterDefaultPage);

  const notificationClosing = useMemo(
    () =>
      isNotification &&
      totalUnapprovedCount === 0 &&
      !hasApprovalFlows &&
      !isSigningQRHardwareTransaction &&
      !isHardwareWalletErrorModalVisible,
    [
      hasApprovalFlows,
      isHardwareWalletErrorModalVisible,
      isNotification,
      isSigningQRHardwareTransaction,
      totalUnapprovedCount,
    ],
  );

  return {
    envType,
    forgottenPassword,
    lastVisitedPerpsRoute,
    notificationClosing,
    pendingRedirectRoute,
    redirectAfterDefaultPage,
    useExternalServices,
  };
}

function useHomeActions() {
  const dispatch = useDispatch();

  return useMemo(
    () => ({
      closeNotificationPopup: () => attemptCloseNotificationPopup(),
      clearLastVisitedPerpsRoute: () =>
        dispatch(setLastVisitedPerpsRoute(null)),
      clearPendingRedirectRoute: () => dispatch(setPendingRedirectRoute(null)),
      clearRedirectAfterDefaultPageAction: () =>
        dispatch(clearRedirectAfterDefaultPage()),
      lookupSelectedNetworksAction: () => dispatch(lookupSelectedNetworks()),
      setBasicFunctionalityModalOpen: () =>
        dispatch(openBasicFunctionalityModal()),
      setRedirectAfterDefaultPageAction: (redirect: { path: string }) =>
        dispatch(setRedirectAfterDefaultPage(redirect)),
    }),
    [dispatch],
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const segmentContext = useSegmentContext();
  const {
    envType,
    forgottenPassword,
    lastVisitedPerpsRoute,
    notificationClosing,
    pendingRedirectRoute,
    redirectAfterDefaultPage,
    useExternalServices,
  } = useHomeState();
  const {
    closeNotificationPopup,
    clearLastVisitedPerpsRoute,
    clearPendingRedirectRoute,
    clearRedirectAfterDefaultPageAction,
    lookupSelectedNetworksAction,
    setBasicFunctionalityModalOpen,
    setRedirectAfterDefaultPageAction,
  } = useHomeActions();

  useEffect(() => {
    if (notificationClosing) {
      closeNotificationPopup();
    }
  }, [notificationClosing, closeNotificationPopup]);

  useRedirectAfterDefaultPage({
    redirectAfterDefaultPage,
    navigate,
    clearRedirectAfterDefaultPage: clearRedirectAfterDefaultPageAction,
  });
  usePendingRedirectRoute({
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage: setRedirectAfterDefaultPageAction,
    clearPendingRedirectRoute,
  });
  useLastVisitedPerpsRoute({
    lastVisitedPerpsRoute,
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage: setRedirectAfterDefaultPageAction,
    clearLastVisitedPerpsRoute,
  });

useEffect(() => {
  if (hasLookupSelectedNetworksRun) {
    return () => {
      // no-op
    };
  }

  hasLookupSelectedNetworksRun = true;
  lookupSelectedNetworksAction();

  return () => {
    // Reset on the next tick so React 18 StrictMode's immediate unmount/remount
    // sequence still dedupes the effect, while genuine later mounts can re-run it.
    setTimeout(() => {
      hasLookupSelectedNetworksRun = false;
    }, 0);
  };
}, [lookupSelectedNetworksAction]);

  const onSupportLinkClick = useCallback(() => {
    if (isMain()) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SupportLinkClicked)
          .addCategory(MetaMetricsEventCategory.Home)
          .addProperties({
            url: SUPPORT_LINK,
            [MetaMetricsContextProp.PageTitle]: segmentContext.page?.title,
          })
          .build(),
      );
    }
  }, [createEventBuilder, segmentContext.page?.title, trackEvent]);

  const handleBasicFunctionalityModalOpen = useCallback(() => {
    setBasicFunctionalityModalOpen();
  }, [setBasicFunctionalityModalOpen]);

  if (forgottenPassword) {
    return <Navigate to={RESTORE_VAULT_ROUTE} replace />;
  }

  if (notificationClosing) {
    return null;
  }

  if (location.pathname === CONNECTED_ROUTE) {
    return (
      <>
        <AppHeader />
        <div className="flex flex-col flex-1 min-h-0">
          <ScrollContainer className="main-container main-container--has-shadow">
            <ConnectedSites navigate={navigate} />
          </ScrollContainer>
          <DappConnectionControlBar />
        </div>
      </>
    );
  }

  if (location.pathname === CONNECTED_ACCOUNTS_ROUTE) {
    return (
      <>
        <AppHeader />
        <div className="flex flex-col flex-1 min-h-0">
          <ScrollContainer className="main-container main-container--has-shadow">
            <ConnectedAccounts navigate={navigate} />
          </ScrollContainer>
          <DappConnectionControlBar />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="flex flex-col flex-1 min-h-0">
        <ScrollContainer className="main-container main-container--has-shadow">
          <div className="home__container">
            <MetaMetricsConsentContainer />
            <PasswordOutdatedModalContainer />
            <MultiRpcEditModalContainer />
            <UpdateModalContainer />
            <RecoveryPhraseReminderContainer />
            <TermsOfUsePopupContainer />
            <ShieldEntryModalContainer />
            <RewardsModalContainer />
            <DeeplinkQrCodeModalContainer />
            <Pna25ModalContainer />
            <ConnectedStatusPopoverContainer />
            <div className="home__main-view">
              <AccountOverview
                onSupportLinkClick={onSupportLinkClick}
                useExternalServices={useExternalServices ?? false}
                setBasicFunctionalityModalOpen={
                  handleBasicFunctionalityModalOpen
                }
              />
              {(isBeta() || isFlask()) && (
                <div className="home__support">
                  <BetaAndFlaskHomeFooter />
                </div>
              )}
            </div>
            <HomeNotificationsContainer />
            <ImportedTokensNotificationContainer />
          </div>

          <HomeDeepLinkActions />
          <ShieldCohortContainer />
        </ScrollContainer>
        <DappConnectionControlBar />
      </div>
    </>
  );
}
