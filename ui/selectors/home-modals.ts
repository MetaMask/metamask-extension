import { createSelector } from 'reselect';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import type { HomeDeepLinkQrCode } from '../pages/home/HomeDeepLinkActions';
import type { MetaMaskReduxState } from '../store/store';
import {
  getIsPrimarySeedPhraseBackedUp,
  getIsSeedlessPasswordOutdated,
} from '../ducks/metamask/metamask';
import { getIsSocialLoginFlow } from './first-time-flow';
import {
  getShowShieldEntryModal,
  getShowRecoveryPhraseReminder,
  getShowTermsOfUse,
  getShowUpdateModal,
} from './selectors';

/**
 * Returns true when the recovery phrase reminder modal should be displayed.
 * Combines the timing-based reminder flag with the seed phrase backup status
 * so callers only need a single boolean for modal priority guard checks.
 *
 * @param state - Redux state object.
 * @returns Whether the recovery phrase reminder modal should be shown.
 */
export const selectShowRecoveryPhrase = createSelector(
  [getShowRecoveryPhraseReminder, getIsPrimarySeedPhraseBackedUp],
  (showRecoveryPhraseReminder, isPrimarySeedPhraseBackedUp) =>
    showRecoveryPhraseReminder && !isPrimarySeedPhraseBackedUp,
);

/**
 * Returns true when the Terms of Use popup should be shown.
 * Combines all conditions into a single boolean for modal priority guard checks.
 *
 * @param state - Redux state object.
 * @param state.metamask
 * @param state.metamask.completedOnboarding
 * @param state.appState
 * @param state.appState.onboardedInThisUISession
 * @returns Whether the Terms of Use popup should be shown.
 */
export const selectShowTermsOfUse = createSelector(
  [
    (state: MetaMaskReduxState) => state.metamask.completedOnboarding,
    (state: MetaMaskReduxState) => state.appState.onboardedInThisUISession,
    getShowTermsOfUse,
    getIsSocialLoginFlow,
  ],
  (
    completedOnboarding,
    onboardedInThisUISession,
    showTermsOfUsePopup,
    isSocialLoginFlow,
  ) =>
    Boolean(completedOnboarding) &&
    !onboardedInThisUISession &&
    showTermsOfUsePopup &&
    !isSocialLoginFlow,
);

/**
 * Returns true when the user has completed onboarding and the modal system is
 * allowed to show modals. Equivalent to the `canSeeModals` local variable that
 * was previously computed in the Home component render method.
 *
 * @param state - Redux state object.
 * @param state.metamask
 * @param state.metamask.completedOnboarding
 * @param state.metamask.firstTimeFlowType
 * @param state.appState
 * @param state.appState.onboardedInThisUISession
 * @param state.appState.newNetworkAddedConfigurationId
 * @returns Whether modals can be shown.
 */
export const selectCanSeeModals = createSelector(
  [
    (state: MetaMaskReduxState) => state.metamask.completedOnboarding,
    (state: MetaMaskReduxState) => state.appState.onboardedInThisUISession,
    (state: MetaMaskReduxState) => state.metamask.firstTimeFlowType,
    (state: MetaMaskReduxState) =>
      state.appState.newNetworkAddedConfigurationId,
  ],
  (
    completedOnboarding,
    onboardedInThisUISession,
    firstTimeFlowType,
    newNetworkAddedConfigurationId,
  ) =>
    Boolean(completedOnboarding) &&
    (!onboardedInThisUISession ||
      firstTimeFlowType === FirstTimeFlowType.import) &&
    !newNetworkAddedConfigurationId,
);

/**
 * Returns true when the Multi-RPC edit modal should be shown.
 *
 * @param state - Redux state object.
 * @param state.metamask
 * @param state.metamask.preferences
 * @param state.metamask.preferences.showMultiRpcModal
 * @returns Whether the Multi-RPC edit modal should be shown.
 */
export const selectShowMultiRpcEditModal = createSelector(
  [
    selectCanSeeModals,
    (state: MetaMaskReduxState) =>
      state.metamask.preferences?.showMultiRpcModal,
  ],
  (canSeeModals, showMultiRpcModal) =>
    canSeeModals && Boolean(showMultiRpcModal) && !process.env.IN_TEST,
);

/**
 * Returns true when the update modal should be shown.
 *
 * @param state - Redux state object.
 * @returns Whether the update modal should be shown.
 */
export const selectDisplayUpdateModal = createSelector(
  [selectCanSeeModals, selectShowMultiRpcEditModal, getShowUpdateModal],
  (canSeeModals, showMultiRpcEditModal, showUpdateModal) =>
    canSeeModals && showUpdateModal && !showMultiRpcEditModal,
);

/**
 * Returns the home deep-link QR code data from Redux state, or null when none
 * is pending. Set by HomeDeepLinkActions when a predict deep-link fires.
 *
 * @param state - Redux state object.
 * @param state.appState
 * @param state.appState.homeDeepLinkQrCode
 * @returns The QR code payload or null.
 */
export function getHomeDeepLinkQrCode(
  state: MetaMaskReduxState,
): HomeDeepLinkQrCode | null {
  return state.appState.homeDeepLinkQrCode ?? null;
}

/**
 * Shared "base" priority guard used by Rewards, PNA25, and DeepLink QR code
 * modals. Returns true only when the lower-priority modals (Terms, MultiRpc,
 * Update, PasswordOutdated, Shield, RecoveryPhrase) are all inactive.
 *
 * @param state - Redux state object.
 * @returns Whether it is safe to show a low-priority modal.
 */
export const selectCanShowLowPriorityModal = createSelector(
  [
    selectCanSeeModals,
    selectShowTermsOfUse,
    selectShowMultiRpcEditModal,
    selectDisplayUpdateModal,
    getIsSeedlessPasswordOutdated,
    getShowShieldEntryModal,
    selectShowRecoveryPhrase,
  ],
  (
    canSeeModals,
    showTermsOfUse,
    showMultiRpcEditModal,
    displayUpdateModal,
    isSeedlessPasswordOutdated,
    showShieldEntryModal,
    showRecoveryPhrase,
  ) =>
    canSeeModals &&
    !showTermsOfUse &&
    !showMultiRpcEditModal &&
    !displayUpdateModal &&
    !isSeedlessPasswordOutdated &&
    !showShieldEntryModal &&
    !showRecoveryPhrase,
);
