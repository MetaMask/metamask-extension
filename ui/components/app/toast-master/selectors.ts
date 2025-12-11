import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  getAllScopesFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../../helpers/constants/survey';
import {
  getAllPermittedAccountsForCurrentTab,
  getOriginOfCurrentTab,
  getPermissions,
  isSolanaAccount,
} from '../../../selectors';
import { MetaMaskReduxState } from '../../../store/store';
import {
  PasswordChangeToastType,
  ClaimSubmitToastType,
} from '../../../../shared/constants/app-state';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree.types';
import { getCaip25CaveatValueFromPermissions } from '../../../pages/permissions-connect/connect-page/utils';
import { supportsChainIds } from '../../../hooks/useAccountGroupsForPermissions';
import { getIsPrivacyToastRecent } from './utils';

type State = {
  appState: Partial<
    Pick<
      MetaMaskReduxState['appState'],
      | 'showNftDetectionEnablementToast'
      | 'showNewSrpAddedToast'
      | 'showPasswordChangeToast'
      | 'showCopyAddressToast'
      | 'showClaimSubmitToast'
    >
  >;
  metamask: Partial<
    Pick<
      MetaMaskReduxState['metamask'],
      | 'newPrivacyPolicyToastClickedOrClosed'
      | 'newPrivacyPolicyToastShownDate'
      | 'onboardingDate'
      | 'surveyLinkLastClickedOrClosed'
      | 'shieldEndingToastLastClickedOrClosed'
      | 'shieldPausedToastLastClickedOrClosed'
      | 'participateInMetaMetrics'
      | 'remoteFeatureFlags'
      | 'pna25Acknowledged'
      | 'completedOnboarding'
    >
  >;
};

/**
 * Determines if the survey toast should be shown based on the current time, survey start and end times, and whether the survey link was last clicked or closed.
 *
 * @param state - The application state containing the necessary survey data.
 * @returns True if the current time is between the survey start and end times and the survey link was not last clicked or closed. False otherwise.
 */
export function selectShowSurveyToast(state: Pick<State, 'metamask'>): boolean {
  if (state.metamask.surveyLinkLastClickedOrClosed) {
    return false;
  }

  const startTime = new Date(`${SURVEY_DATE} ${SURVEY_START_TIME}`).getTime();
  const endTime = new Date(`${SURVEY_DATE} ${SURVEY_END_TIME}`).getTime();
  const now = Date.now();

  return now > startTime && now < endTime;
}

/**
 * Determines if the privacy policy toast should be shown based on the current date and whether the new privacy policy toast was clicked or closed.
 *
 * @param state - The application state containing the privacy policy data.
 * @returns Boolean is True if the toast should be shown, and the number is the date the toast was last shown.
 */
export function selectShowPrivacyPolicyToast(state: Pick<State, 'metamask'>): {
  showPrivacyPolicyToast: boolean;
  newPrivacyPolicyToastShownDate?: number | null;
} {
  const {
    newPrivacyPolicyToastClickedOrClosed,
    newPrivacyPolicyToastShownDate,
    onboardingDate,
  } = state.metamask || {};
  const newPrivacyPolicyDate = new Date(PRIVACY_POLICY_DATE);
  const currentDate = new Date(Date.now());

  const showPrivacyPolicyToast =
    !newPrivacyPolicyToastClickedOrClosed &&
    currentDate >= newPrivacyPolicyDate &&
    getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate) &&
    // users who onboarded before the privacy policy date should see the notice
    // and
    // old users who don't have onboardingDate set should see the notice
    (!onboardingDate || onboardingDate < newPrivacyPolicyDate.valueOf());

  return { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate };
}

export function selectNftDetectionEnablementToast(
  state: Pick<State, 'appState'>,
): boolean {
  return Boolean(state.appState.showNftDetectionEnablementToast);
}

// If there is more than one connected account to activeTabOrigin,
// *BUT* the current account is not one of them, show the banner
export function selectShowConnectAccountToast(
  state: State & Pick<MetaMaskReduxState, 'activeTab'>,
  account: InternalAccount,
): boolean {
  const allowShowAccountSetting = getAlertEnabledness(state).unconnectedAccount;
  const connectedAccounts = getAllPermittedAccountsForCurrentTab(state);

  // We only support connection with EVM or Solana accounts
  // This check prevents Bitcoin snap accounts from showing the toast
  const isEvmAccount = isEvmAccountType(account?.type);
  const isSolanaAccountSelected = isSolanaAccount(account);
  const isConnectableAccount = isEvmAccount || isSolanaAccountSelected;

  const showConnectAccountToast =
    allowShowAccountSetting &&
    account &&
    state.activeTab.origin &&
    isConnectableAccount &&
    connectedAccounts.length > 0 &&
    !isInternalAccountInPermittedAccountIds(account, connectedAccounts);

  return showConnectAccountToast;
}

// If there is more than one connected account to activeTabOrigin,
// *BUT* the current account is not one of them, show the banner
export function selectShowConnectAccountGroupToast(
  state: State & Pick<MetaMaskReduxState, 'activeTab'>,
  accountGroup: AccountGroupWithInternalAccounts,
): boolean {
  const allowShowAccountSetting = getAlertEnabledness(state).unconnectedAccount;
  const connectedAccounts = getAllPermittedAccountsForCurrentTab(state);
  const activeTabOrigin = getOriginOfCurrentTab(state);
  const existingPermissions = getPermissions(state, activeTabOrigin);
  const existingCaip25CaveatValue = existingPermissions
    ? getCaip25CaveatValueFromPermissions(existingPermissions)
    : null;
  const existingChainIds = existingCaip25CaveatValue
    ? getAllScopesFromCaip25CaveatValue(existingCaip25CaveatValue)
    : [];

  const isAccountSupported = supportsChainIds(accountGroup, existingChainIds);

  const isConnected = accountGroup.accounts.some((account) => {
    return isInternalAccountInPermittedAccountIds(account, connectedAccounts);
  });

  const showConnectAccountToast =
    allowShowAccountSetting &&
    accountGroup &&
    isAccountSupported &&
    state.activeTab.origin &&
    connectedAccounts.length > 0 &&
    !isConnected;

  return showConnectAccountToast;
}

/**
 * Retrieves user preference to see the "New SRP Added" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectNewSrpAdded(state: Pick<State, 'appState'>): boolean {
  return Boolean(state.appState.showNewSrpAddedToast);
}

/**
 * Retrieves user preference to see the "Password Change Error" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectPasswordChangeToast(
  state: Pick<State, 'appState'>,
): PasswordChangeToastType | null {
  return state.appState.showPasswordChangeToast || null;
}

/**
 * Retrieves user preference to see the "Copy Address" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectShowCopyAddressToast(
  state: Pick<State, 'appState'>,
): boolean {
  return Boolean(state.appState.showCopyAddressToast);
}

/**
 * Retrieves the state for the "Claim Submit" toast
 *
 * @param state - Redux state object.
 * @returns ClaimSubmitToastType or null
 */
export function selectClaimSubmitToast(
  state: Pick<State, 'appState'>,
): ClaimSubmitToastType | null {
  return state.appState.showClaimSubmitToast || null;
}

/**
 * Retrieves user preference to see the "Shield Payment Declined" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectShowShieldPausedToast(
  state: Pick<State, 'metamask'>,
): boolean {
  return !state.metamask.shieldPausedToastLastClickedOrClosed;
}

/**
 * Retrieves user preference to see the "Shield Coverage Ending" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectShowShieldEndingToast(
  state: Pick<State, 'metamask'>,
): boolean {
  return !state.metamask.shieldEndingToastLastClickedOrClosed;
}

/**
 * Determines if the PNA25 banner should be shown based on:
 * - User has completed onboarding (completedOnboarding === true)
 * - LaunchDarkly feature flag (extensionUxPna25) is enabled
 * - User has opted into metrics (participateInMetaMetrics === true)
 * - User hasn't acknowledged the banner yet (pna25Acknowledged === false)
 *
 * Regular new users: Go through metametrics page → pna25Acknowledged = true → don't see banner
 * Social login users: Skip metametrics page → pna25Acknowledged = false → see banner
 * Existing users: pna25Acknowledged = false (default) → see banner
 *
 * @param state - The application state containing the banner data.
 * @returns Boolean indicating whether to show the banner
 */
export function selectShowPna25Modal(state: Pick<State, 'metamask'>): boolean {
  const {
    completedOnboarding,
    participateInMetaMetrics,
    pna25Acknowledged,
    remoteFeatureFlags,
  } = state.metamask || {};

  // Only show to users who have completed onboarding
  if (!completedOnboarding) {
    return false; // User hasn't completed onboarding yet
  }

  // For onboarding screen, we use local flag and for existing users, we use LaunchDarkly flag
  const isPna25Enabled = remoteFeatureFlags?.extensionUxPna25;

  // Check all conditions
  if (!isPna25Enabled) {
    return false; // LD flag not enabled
  }

  if (participateInMetaMetrics !== true) {
    return false; // User hasn't opted into metrics
  }

  if (pna25Acknowledged === true) {
    return false; // User already acknowledged
  }

  // Only show banner if explicitly false (existing users who haven't acknowledged)
  return pna25Acknowledged === false;
}
