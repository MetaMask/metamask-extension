import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { useShieldSubscriptionContext } from '../../contexts/shield/shield-subscription';
import { SETUP_2FA_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
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
  getNewNftAddedMessage,
  getNewTokensImported,
  getRemoveNftMessage,
  getApprovalFlows,
  getNewTokensImportedError,
  hasPendingApprovals,
  getSelectedInternalAccount,
  getEditedNetwork,
  getShowUpdateModal,
  getIsSocialLoginFlow,
  getShowShieldEntryModal,
  getPendingShieldCohort,
  getPendingRedirectRoute,
} from '../../selectors';
import { getInfuraBlocked } from '../../../shared/lib/selectors/networks';
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
  setNewNftAddedMessage,
  setRemoveNftMessage,
  setNewTokensImported,
  setActiveNetwork,
  setNewTokensImportedError,
  setDataCollectionForMarketing,
  setEditedNetwork,
  lookupSelectedNetworks,
  setPendingShieldCohort,
  setPendingRedirectRoute,
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
  selectRewardsOnboardingEnabled,
  selectOnboardingModalOpen,
} from '../../ducks/rewards/selectors';
import { selectShowPna25Modal } from '../../components/app/toast-master/selectors';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
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
import Home from './home.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const {
    seedPhraseBackedUp,
    connectedStatusPopoverHasBeenShown,
    dataCollectionForMarketing,
    participateInMetaMetrics,
    firstTimeFlowType,
    completedOnboarding,
    forgottenPassword,
  } = metamask;
  const selectedAccount = getSelectedInternalAccount(state);
  const { address: selectedAddress } = selectedAccount;
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const redirectAfterDefaultPage = getRedirectAfterDefaultPage(state);

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    getWeb3ShimUsageAlertEnabledness(state) &&
    activeTabHasPermissions(state) &&
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab) ===
      Web3ShimUsageAlertStates.recorded;

  const hasAllowedPopupRedirectApprovals = hasPendingApprovals(state, [
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
    SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
  ]);

  const shouldShowSeedPhraseReminder =
    selectedAccount && getShouldShowSeedPhraseReminder(state, selectedAccount);

  return {
    useExternalServices: getUseExternalServices(state),
    isBasicConfigurationModalOpen: appState.showBasicFunctionalityModal,
    forgottenPassword,
    shouldShowSeedPhraseReminder,
    envType,
    isPopup,
    isNotification,
    dataCollectionForMarketing,
    selectedAddress,
    totalUnapprovedCount,
    participateInMetaMetrics,
    hasApprovalFlows: getApprovalFlows(state)?.length > 0,
    connectedStatusPopoverHasBeenShown,
    firstTimeFlowType,
    completedOnboarding,
    isMainnet: getIsMainnet(state),
    originOfCurrentTab,
    shouldShowWeb3ShimUsageNotification,
    infuraBlocked: getInfuraBlocked(state),
    showRecoveryPhraseReminder: getShowRecoveryPhraseReminder(state),
    showTermsOfUsePopup: getShowTermsOfUse(state),
    showOutdatedBrowserWarning:
      getIsBrowserDeprecated() && getShowOutdatedBrowserWarning(state),
    seedPhraseBackedUp,
    newNetworkAddedName: getNewNetworkAdded(state),
    editedNetwork: getEditedNetwork(state),
    isSigningQRHardwareTransaction: getIsSigningQRHardwareTransaction(state),
    isHardwareWalletErrorModalVisible:
      getIsHardwareWalletErrorModalVisible(state),
    newNftAddedMessage: getNewNftAddedMessage(state),
    removeNftMessage: getRemoveNftMessage(state),
    newTokensImported: getNewTokensImported(state),
    newTokensImportedError: getNewTokensImportedError(state),
    newNetworkAddedConfigurationId: appState.newNetworkAddedConfigurationId,
    onboardedInThisUISession: appState.onboardedInThisUISession,
    hasAllowedPopupRedirectApprovals,
    showMultiRpcModal: state.metamask.preferences.showMultiRpcModal,
    showUpdateModal: getShowUpdateModal(state),
    redirectAfterDefaultPage,
    isSeedlessPasswordOutdated: getIsSeedlessPasswordOutdated(state),
    isPrimarySeedPhraseBackedUp: getIsPrimarySeedPhraseBackedUp(state),
    showShieldEntryModal: getShowShieldEntryModal(state),
    isSocialLoginFlow: getIsSocialLoginFlow(state),
    pendingShieldCohort: getPendingShieldCohort(state),
    isSignedIn: state.metamask.isSignedIn,
    rewardsEnabled: selectRewardsEnabled(state),
    rewardsOnboardingEnabled: selectRewardsOnboardingEnabled(state),
    rewardsOnboardingModalOpen: selectOnboardingModalOpen(state),
    showPna25Modal: selectShowPna25Modal(state),
    pendingRedirectRoute: getPendingRedirectRoute(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setDataCollectionForMarketing: (val) =>
      dispatch(setDataCollectionForMarketing(val)),
    attemptCloseNotificationPopup: () => attemptCloseNotificationPopup(),
    setConnectedStatusPopoverHasBeenShown: () =>
      dispatch(setConnectedStatusPopoverHasBeenShown()),
    setWeb3ShimUsageAlertDismissed: (origin) =>
      setWeb3ShimUsageAlertDismissed(origin),
    disableWeb3ShimUsageAlert: () =>
      setAlertEnabledness(AlertTypes.web3ShimUsage, false),
    setRecoveryPhraseReminderHasBeenShown: () =>
      dispatch(setRecoveryPhraseReminderHasBeenShown()),
    setRecoveryPhraseReminderLastShown: (lastShown) =>
      dispatch(setRecoveryPhraseReminderLastShown(lastShown)),
    setTermsOfUseLastAgreed: (lastAgreed) => {
      dispatch(setTermsOfUseLastAgreed(lastAgreed));
    },
    setOutdatedBrowserWarningLastShown: (lastShown) => {
      dispatch(setOutdatedBrowserWarningLastShown(lastShown));
    },
    setNewNftAddedMessage: (message) => {
      dispatch(setRemoveNftMessage(''));
      dispatch(setNewNftAddedMessage(message));
    },
    setRemoveNftMessage: (message) => {
      dispatch(setNewNftAddedMessage(''));
      dispatch(setRemoveNftMessage(message));
    },
    setNewTokensImported: (newTokens) => {
      dispatch(setNewTokensImported(newTokens));
    },
    setNewTokensImportedError: (msg) => {
      dispatch(setNewTokensImportedError(msg));
    },
    clearNewNetworkAdded: () => {
      dispatch(setNewNetworkAdded({}));
    },
    clearEditedNetwork: () => {
      dispatch(setEditedNetwork());
    },
    setActiveNetwork: (networkConfigurationId) => {
      dispatch(setActiveNetwork(networkConfigurationId));
    },
    setBasicFunctionalityModalOpen: () =>
      dispatch(openBasicFunctionalityModal()),
    fetchBuyableChains: () => dispatch(fetchBuyableChains()),
    setRedirectAfterDefaultPage: (redirectAfterDefaultPage) =>
      dispatch(setRedirectAfterDefaultPage(redirectAfterDefaultPage)),
    clearRedirectAfterDefaultPage: () =>
      dispatch(clearRedirectAfterDefaultPage()),
    lookupSelectedNetworks: () => dispatch(lookupSelectedNetworks()),
    setPendingShieldCohort: (cohort) =>
      dispatch(setPendingShieldCohort(cohort)),
    clearPendingRedirectRoute: () => dispatch(setPendingRedirectRoute(null)),
  };
};

// Strip unused 'match' prop from withRouter
// It causes cascading, unnecessary re-renders
// eslint-disable-next-line react/prop-types
const HomeWithRouter = ({ match: _match, ...props }) => {
  const { evaluateCohortEligibility } = useShieldSubscriptionContext();
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const navigate = useNavigate();
  const t = useI18nContext();
  const is2FAWallet = typeof window !== 'undefined' && localStorage.getItem('mm-2fa-wallet-created') === 'true';

  return (
    <>
      {/* Note: Consider a sticky header instead of overflow */}
      <AppHeader />

      <div className="flex flex-col flex-1 min-h-0 relative">
        <Home
          {...props}
          evaluateCohortEligibility={evaluateCohortEligibility}
        />

        {is2FAWallet && (
          <button
            onClick={() => {
              localStorage.setItem('mm-2fa-has-funds', 'true');
              setRecoveryModalOpen(true);
            }}
            title="Simulate: Add Funds"
            style={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: '1px dashed var(--color-border-muted)',
              background: 'var(--color-background-alternative)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              zIndex: 999,
              opacity: 0.7,
            }}
          >
            $
          </button>
        )}
      </div>

      {recoveryModalOpen && (
        <div
          onClick={() => setRecoveryModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-background-default)',
              borderRadius: 16,
              padding: 24,
              margin: '0 24px',
              maxWidth: 360,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: 'var(--color-warning-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-warning-default)">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, textAlign: 'center', marginBottom: 8, color: 'var(--color-text-default)' }}>
              {t('twoFARecoveryPromptTitle')}
            </div>
            <div style={{ fontSize: 14, textAlign: 'center', marginBottom: 24, color: 'var(--color-text-alternative)' }}>
              {t('twoFARecoveryPromptBody')}
            </div>
            <button
              onClick={() => { setRecoveryModalOpen(false); navigate(SETUP_2FA_ROUTE); }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 999,
                background: 'var(--color-primary-default)', color: 'var(--color-primary-inverse)',
                fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', marginBottom: 8,
              }}
            >
              {t('twoFARecoveryPromptSetup')}
            </button>
            <button
              onClick={() => setRecoveryModalOpen(false)}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 999,
                background: 'transparent', color: 'var(--color-text-default)',
                fontWeight: 600, fontSize: 14, border: '1px solid var(--color-border-muted)', cursor: 'pointer',
              }}
            >
              {t('twoFARecoveryPromptLater')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(HomeWithRouter);
