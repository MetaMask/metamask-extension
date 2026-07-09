import React, { useEffect, useCallback, useContext } from 'react';
import {
  Navigate,
  type NavigateFunction,
  type Location as RouterLocation,
} from 'react-router-dom';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
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
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { AccountOverview } from '../../components/multichain';
import { PasswordOutdatedModalContainer } from '../../components/app/password-outdated-modal';
import { ShieldEntryModalContainer } from '../../components/app/shield-entry-modal';
import { RewardsModalContainer } from '../../components/app/rewards/onboarding/rewards-modal-container';
import { Pna25ModalContainer } from '../../components/app/modals/pna25-modal/pna25-modal-container';
import { isBeta, isFlask, isMain } from '../../../shared/lib/build-types';
import { MetaMetricsContext } from '../../contexts/metametrics';
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
  type PendingRedirectRoute,
  type RedirectAfterDefaultPage,
  type LastVisitedPerpsRoute,
} from './useHomeRedirects';

/** Survives StrictMode remounts within the same extension session. */
let hasLookupSelectedNetworksRun = false;

/** @internal */
export function resetLookupSelectedNetworksForTesting(): void {
  hasLookupSelectedNetworksRun = false;
}

export type HomeProps = {
  navigate?: NavigateFunction;
  forgottenPassword?: boolean;
  notificationClosing: boolean;
  location?: RouterLocation;
  attemptCloseNotificationPopup: () => void;
  useExternalServices?: boolean;
  setBasicFunctionalityModalOpen?: () => void;
  redirectAfterDefaultPage?: RedirectAfterDefaultPage;
  setRedirectAfterDefaultPage?: (redirect: { path: string }) => void;
  clearRedirectAfterDefaultPage?: () => void;
  lookupSelectedNetworks: () => void;
  envType?: string;
  pendingRedirectRoute?: PendingRedirectRoute | null;
  clearPendingRedirectRoute?: () => void;
  lastVisitedPerpsRoute?: LastVisitedPerpsRoute | null;
  clearLastVisitedPerpsRoute?: () => void;
};

export default function Home({
  navigate,
  forgottenPassword,
  notificationClosing,
  location,
  attemptCloseNotificationPopup,
  useExternalServices,
  setBasicFunctionalityModalOpen,
  redirectAfterDefaultPage,
  setRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
  lookupSelectedNetworks,
  envType,
  pendingRedirectRoute,
  clearPendingRedirectRoute,
  lastVisitedPerpsRoute,
  clearLastVisitedPerpsRoute,
}: HomeProps) {
  const { trackEvent } = useContext(MetaMetricsContext);

  // Close the notification popup when `notificationClosing` becomes true.
  useEffect(() => {
    if (notificationClosing) {
      attemptCloseNotificationPopup();
    }
  }, [notificationClosing, attemptCloseNotificationPopup]);

  useRedirectAfterDefaultPage({
    redirectAfterDefaultPage,
    navigate,
    clearRedirectAfterDefaultPage,
  });
  usePendingRedirectRoute({
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearPendingRedirectRoute,
  });
  useLastVisitedPerpsRoute({
    lastVisitedPerpsRoute,
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearLastVisitedPerpsRoute,
  });

  useEffect(() => {
    if (hasLookupSelectedNetworksRun) {
      return;
    }
    hasLookupSelectedNetworksRun = true;
    lookupSelectedNetworks();
  }, [lookupSelectedNetworks]);

  const onSupportLinkClick = useCallback(() => {
    if (isMain()) {
      trackEvent(
        {
          category: MetaMetricsEventCategory.Home,
          event: MetaMetricsEventName.SupportLinkClicked,
          properties: { url: SUPPORT_LINK },
        },
        { contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle] },
      );
    }
  }, [trackEvent]);

  if (forgottenPassword) {
    return <Navigate to={RESTORE_VAULT_ROUTE} replace />;
  }

  if (notificationClosing) {
    return null;
  }

  if (location?.pathname === CONNECTED_ROUTE) {
    return (
      <ScrollContainer className="main-container main-container--has-shadow">
        <ConnectedSites navigate={navigate} />
      </ScrollContainer>
    );
  }

  if (location?.pathname === CONNECTED_ACCOUNTS_ROUTE) {
    return (
      <ScrollContainer className="main-container main-container--has-shadow">
        <ConnectedAccounts navigate={navigate} />
      </ScrollContainer>
    );
  }

  return (
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
              setBasicFunctionalityModalOpen ?? (() => undefined)
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

      {/* Ghost components — manage side effects without rendering visible UI */}
      <HomeDeepLinkActions />
      <ShieldCohortContainer />
    </ScrollContainer>
  );
}
