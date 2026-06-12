import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShieldSubscriptionContext } from '../../contexts/shield/shield-subscription';
import {
  activeTabHasPermissions,
  getUseExternalServices,
  getIsMainnet,
  getOriginOfCurrentTab,
  getTotalUnapprovedCount,
  getWeb3ShimUsageStateForOrigin,
  getShowRecoveryPhraseReminder,
  getShowTermsOfUse,
  getShowOutdatedBrowserWarning,
  getNewNetworkAdded,
  getIsSigningQRHardwareTransaction,
  getIsHardwareWalletErrorModalVisible,
  getNewTokensImported,
  getApprovalFlows,
  getNewTokensImportedError,
  hasPendingApprovals,
  getEditedNetwork,
  getShowUpdateModal,
  getIsSocialLoginFlow,
  getShowShieldEntryModal,
  getPendingShieldCohort,
  getPendingRedirectRoute,
  getLastVisitedPerpsRoute,
  getParticipateInMetaMetrics,
} from '../../selectors';
import { getInfuraBlocked } from '../../../shared/lib/selectors/networks';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  attemptCloseNotificationPopup,
  setConnectedStatusPopoverHasBeenShown,
  setWeb3ShimUsageAlertDismissed,
  setAlertEnabledness,
  setRecoveryPhraseReminderHasBeenShown,
  setRecoveryPhraseReminderLastShown,
  setTermsOfUseLastAgreed,
  setOutdatedBrowserWarningLastShown,
  setNewNetworkAdded,
  setNewTokensImported,
  setActiveNetwork,
  setNewTokensImportedError,
  setDataCollectionForMarketing,
  setEditedNetwork,
  lookupSelectedNetworks,
  setPendingShieldCohort,
  setPendingRedirectRoute,
  setLastVisitedPerpsRoute,
} from '../../store/actions';
import { openBasicFunctionalityModal } from '../../ducks/app/app';
import {
  getIsPrimarySeedPhraseBackedUp,
  getIsSeedlessPasswordOutdated,
  getWeb3ShimUsageAlertEnabledness,
} from '../../ducks/metamask/metamask';
import { fetchBuyableChains } from '../../ducks/ramps';
import {
  selectRewardsEnabled,
  selectRewardsModalOpen,
} from '../../ducks/rewards/selectors';
import { selectShowPna25Modal } from '../../components/app/toast-master/selectors';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { getIsBrowserDeprecated } from '../../helpers/utils/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES,
} from '../../../shared/constants/app';
import {
  AlertTypes,
  Web3ShimUsageAlertStates,
} from '../../../shared/constants/alerts';
import { getShouldShowSeedPhraseReminder } from '../../selectors/multi-srp/multi-srp';
import {
  getRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
  setRedirectAfterDefaultPage,
} from '../../ducks/history/history';
import { AppHeader } from '../../components/multichain/app-header';
import { DappConnectionControlBar } from '../../components/multichain/dapp-connection-control-bar';
import Home from './home.component';

function useCoreHomeState() {
  const selectedAddress = useSelector(
    (state: any) => getSelectedInternalAccount(state)?.address,
  );
  const forgottenPassword = useSelector(
    (state: any) => state.metamask.forgottenPassword,
  );
  const firstTimeFlowType = useSelector(
    (state: any) => state.metamask.firstTimeFlowType,
  );
  const completedOnboarding = useSelector(
    (state: any) => state.metamask.completedOnboarding,
  );
  const seedPhraseBackedUp = useSelector(
    (state: any) => state.metamask.seedPhraseBackedUp,
  );
  const connectedStatusPopoverHasBeenShown = useSelector(
    (state: any) => state.metamask.connectedStatusPopoverHasBeenShown,
  );
  const dataCollectionForMarketing = useSelector(
    (state: any) => state.metamask.dataCollectionForMarketing,
  );
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  // Derive both account and reminder flag inside one selector to avoid a
  // stale closure over the account object.
  const shouldShowSeedPhraseReminder = useSelector((state: any) => {
    const account = getSelectedInternalAccount(state);
    return account ? getShouldShowSeedPhraseReminder(state, account) : false;
  });
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const isSeedlessPasswordOutdated = useSelector(getIsSeedlessPasswordOutdated);

  return {
    selectedAddress,
    forgottenPassword,
    firstTimeFlowType,
    completedOnboarding,
    seedPhraseBackedUp,
    connectedStatusPopoverHasBeenShown,
    dataCollectionForMarketing,
    participateInMetaMetrics,
    shouldShowSeedPhraseReminder,
    isPrimarySeedPhraseBackedUp,
    isSeedlessPasswordOutdated,
  };
}

function useNetworkState() {
  const isMainnet = useSelector(getIsMainnet);
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);
  const infuraBlocked = useSelector(getInfuraBlocked);
  const useExternalServices = useSelector(getUseExternalServices);

  // Mirrors the short-circuit evaluation from the original mapStateToProps so
  // that getWeb3ShimUsageStateForOrigin is never called when not needed
  // (avoids reading undefined state keys in non-popup environments).
  const shouldShowWeb3ShimUsageNotification = useSelector((state: any) => {
    if (getEnvironmentType() !== ENVIRONMENT_TYPE_POPUP) {
      return false;
    }
    if (!getWeb3ShimUsageAlertEnabledness(state)) {
      return false;
    }
    if (!activeTabHasPermissions(state)) {
      return false;
    }
    const origin = getOriginOfCurrentTab(state);
    return (
      getWeb3ShimUsageStateForOrigin(state, origin) ===
      Web3ShimUsageAlertStates.recorded
    );
  });

  return {
    isMainnet,
    originOfCurrentTab,
    infuraBlocked,
    useExternalServices,
    shouldShowWeb3ShimUsageNotification,
  };
}

function useNotificationState() {
  const totalUnapprovedCount = useSelector(getTotalUnapprovedCount);
  const hasApprovalFlows = useSelector(
    (state: any) => (getApprovalFlows(state)?.length ?? 0) > 0,
  );
  const hasAllowedPopupRedirectApprovals = useSelector((state: any) =>
    hasPendingApprovals(state, [
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
      SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
    ]),
  );
  const showRecoveryPhraseReminder = useSelector(getShowRecoveryPhraseReminder);
  const showTermsOfUsePopup = useSelector(getShowTermsOfUse);
  const showOutdatedBrowserWarning = useSelector(
    (state: any) =>
      getIsBrowserDeprecated() && getShowOutdatedBrowserWarning(state),
  );
  const newNetworkAddedName = useSelector(getNewNetworkAdded);
  const editedNetwork = useSelector(getEditedNetwork);
  const newTokensImported = useSelector(getNewTokensImported);
  const newTokensImportedError = useSelector(getNewTokensImportedError);
  const showUpdateModal = useSelector(getShowUpdateModal);
  const isSigningQRHardwareTransaction = useSelector(
    getIsSigningQRHardwareTransaction,
  );
  const isHardwareWalletErrorModalVisible = useSelector(
    getIsHardwareWalletErrorModalVisible,
  );

  return {
    totalUnapprovedCount,
    hasApprovalFlows,
    hasAllowedPopupRedirectApprovals,
    showRecoveryPhraseReminder,
    showTermsOfUsePopup,
    showOutdatedBrowserWarning,
    newNetworkAddedName,
    editedNetwork,
    newTokensImported,
    newTokensImportedError,
    showUpdateModal,
    isSigningQRHardwareTransaction,
    isHardwareWalletErrorModalVisible,
  };
}

function useAppUIState() {
  const envType = getEnvironmentType();

  const isBasicConfigurationModalOpen = useSelector(
    (state: any) => state.appState.showBasicFunctionalityModal,
  );
  const newNetworkAddedConfigurationId = useSelector(
    (state: any) => state.appState.newNetworkAddedConfigurationId,
  );
  const onboardedInThisUISession = useSelector(
    (state: any) => state.appState.onboardedInThisUISession,
  );
  const showMultiRpcModal = useSelector(
    (state: any) => state.metamask.preferences.showMultiRpcModal,
  );

  return {
    envType,
    isPopup: envType === ENVIRONMENT_TYPE_POPUP,
    isNotification: envType === ENVIRONMENT_TYPE_NOTIFICATION,
    isBasicConfigurationModalOpen,
    newNetworkAddedConfigurationId,
    onboardedInThisUISession,
    showMultiRpcModal,
  };
}

function useFeatureState() {
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const showShieldEntryModal = useSelector(getShowShieldEntryModal);
  const pendingShieldCohort = useSelector(getPendingShieldCohort);
  const isSignedIn = useSelector((state: any) => state.metamask.isSignedIn);
  const rewardsEnabled = useSelector(selectRewardsEnabled);
  const rewardsModalOpen = useSelector(selectRewardsModalOpen);
  const showPna25Modal = useSelector(selectShowPna25Modal);
  const pendingRedirectRoute = useSelector(getPendingRedirectRoute);
  const lastVisitedPerpsRoute = useSelector(getLastVisitedPerpsRoute);
  const redirectAfterDefaultPage = useSelector(getRedirectAfterDefaultPage);

  return {
    isSocialLoginFlow,
    showShieldEntryModal,
    pendingShieldCohort,
    isSignedIn,
    rewardsEnabled,
    rewardsModalOpen,
    showPna25Modal,
    pendingRedirectRoute,
    lastVisitedPerpsRoute,
    redirectAfterDefaultPage,
  };
}

function useHomeActions() {
  const dispatch = useDispatch();

  return {
    setDataCollectionForMarketing: (val: boolean) =>
      dispatch(setDataCollectionForMarketing(val)),
    // Not dispatched — calls background directly
    attemptCloseNotificationPopup: () => attemptCloseNotificationPopup(),
    setConnectedStatusPopoverHasBeenShown: () =>
      dispatch(setConnectedStatusPopoverHasBeenShown()),
    // Not dispatched — calls background directly
    setWeb3ShimUsageAlertDismissed: (origin: string) =>
      setWeb3ShimUsageAlertDismissed(origin),
    // Not dispatched — calls background directly
    disableWeb3ShimUsageAlert: () =>
      setAlertEnabledness(AlertTypes.web3ShimUsage, false),
    setRecoveryPhraseReminderHasBeenShown: () =>
      dispatch(setRecoveryPhraseReminderHasBeenShown()),
    setRecoveryPhraseReminderLastShown: (lastShown: number) =>
      dispatch(setRecoveryPhraseReminderLastShown(lastShown)),
    setTermsOfUseLastAgreed: (lastAgreed: number) =>
      dispatch(setTermsOfUseLastAgreed(lastAgreed)),
    setOutdatedBrowserWarningLastShown: (lastShown: number) =>
      dispatch(setOutdatedBrowserWarningLastShown(lastShown)),
    setNewTokensImported: (newTokens: string) =>
      dispatch(setNewTokensImported(newTokens)),
    setNewTokensImportedError: (msg: string) =>
      dispatch(setNewTokensImportedError(msg)),
    clearNewNetworkAdded: () => dispatch(setNewNetworkAdded({})),
    clearEditedNetwork: () => dispatch(setEditedNetwork()),
    setActiveNetwork: (networkConfigurationId: string) =>
      dispatch(setActiveNetwork(networkConfigurationId)),
    setBasicFunctionalityModalOpen: () =>
      dispatch(openBasicFunctionalityModal()),
    fetchBuyableChains: () => dispatch(fetchBuyableChains()),
    setRedirectAfterDefaultPage: (redirect: object) =>
      dispatch(setRedirectAfterDefaultPage(redirect)),
    clearRedirectAfterDefaultPage: () =>
      dispatch(clearRedirectAfterDefaultPage()),
    lookupSelectedNetworks: () => dispatch(lookupSelectedNetworks()),
    setPendingShieldCohort: (cohort: string) =>
      dispatch(setPendingShieldCohort(cohort)),
    clearPendingRedirectRoute: () => dispatch(setPendingRedirectRoute(null)),
    clearLastVisitedPerpsRoute: () => dispatch(setLastVisitedPerpsRoute(null)),
  };
}

export default function HomeContainer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { evaluateCohortEligibility } = useShieldSubscriptionContext();

  const coreState = useCoreHomeState();
  const networkState = useNetworkState();
  const notificationState = useNotificationState();
  const appUIState = useAppUIState();
  const featureState = useFeatureState();
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
          {...featureState}
          {...actions}
          navigate={navigate}
          location={location}
          evaluateCohortEligibility={evaluateCohortEligibility}
        />
        <DappConnectionControlBar />
      </div>
    </>
  );
}
