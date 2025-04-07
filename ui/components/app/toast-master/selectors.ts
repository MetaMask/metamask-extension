import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../../helpers/constants/survey';
import { getPermittedAccountsForCurrentTab } from '../../../selectors';
import { MetaMaskReduxState } from '../../../store/store';
import { getIsPrivacyToastRecent } from './utils';

// TODO: get this into one of the larger definitions of state type
type State = Omit<MetaMaskReduxState, 'appState'> & {
  appState: {
    showNftDetectionEnablementToast?: boolean;
    ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
    showNewSrpAddedToast?: boolean;
    ///: END:ONLY_INCLUDE_IF
  };
  metamask: {
    newPrivacyPolicyToastClickedOrClosed?: boolean;
    newPrivacyPolicyToastShownDate?: number;
    onboardingDate?: number;
    showNftDetectionEnablementToast?: boolean;
    surveyLinkLastClickedOrClosed?: number;
    switchedNetworkNeverShowMessage?: boolean;
    // Keep the remoteFeatureFlags property as is
    remoteFeatureFlags?: Record<string, unknown>;
  };
};

/**
 * Determines if the survey toast should be shown based on the current time, survey start and end times, and whether the survey link was last clicked or closed.
 *
 * @param state - The application state containing the necessary survey data.
 * @returns True if the current time is between the survey start and end times and the survey link was not last clicked or closed. False otherwise.
 */
export function selectShowSurveyToast(state: State): boolean {
  if (state.metamask?.surveyLinkLastClickedOrClosed) {
    return false;
  }

  const startTime = new Date(`${SURVEY_DATE} ${SURVEY_START_TIME}`).getTime();
  const endTime = new Date(`${SURVEY_DATE} ${SURVEY_END_TIME}`).getTime();
  const now = Date.now();

  return now > startTime && now < endTime;
}

/**
 * Determines if the privacy policy toast should be shown based on the remote feature flag and whether the toast was clicked or closed.
 *
 * @param state - The application state containing the privacy policy data.
 * @returns Boolean is True if the toast should be shown, and the number is the date the toast was last shown.
 */
export function selectShowPrivacyPolicyToast(state: State): {
  showPrivacyPolicyToast: boolean;
  newPrivacyPolicyToastShownDate?: number;
} {
  const {
    newPrivacyPolicyToastClickedOrClosed,
    newPrivacyPolicyToastShownDate,
    onboardingDate,
  } = state.metamask || {};

  const remoteFeatureFlags = state.metamask?.remoteFeatureFlags || {};

  const policyUpdateDate = String(
    remoteFeatureFlags.transactionsPrivacyPolicyUpdate || '',
  );

  // If the feature flag isn't set or is empty, don't show the toast
  if (!policyUpdateDate) {
    // No policy update date found
    return { showPrivacyPolicyToast: false, newPrivacyPolicyToastShownDate };
  }

  // Create dates and ensure consistent timezone handling
  const newPrivacyPolicyDate = new Date(policyUpdateDate);
  const currentDate = new Date();

  const currentTimestamp = currentDate.getTime();
  const policyTimestamp = newPrivacyPolicyDate.getTime();

  const isRecent = getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate);
  const beforePolicyUpdate =
    !onboardingDate || onboardingDate <= policyTimestamp;
  const afterPolicyDate = currentTimestamp >= policyTimestamp;

  const showPrivacyPolicyToast =
    !newPrivacyPolicyToastClickedOrClosed &&
    isRecent &&
    beforePolicyUpdate &&
    afterPolicyDate;

  return { showPrivacyPolicyToast, newPrivacyPolicyToastShownDate };
}

// If there is more than one connected account to activeTabOrigin,
// *BUT* the current account is not one of them, show the banner
export function selectShowConnectAccountToast(
  state: State,
  account: InternalAccount,
): boolean {
  const allowShowAccountSetting = getAlertEnabledness(state).unconnectedAccount;
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);
  const isEvmAccount = isEvmAccountType(account?.type);

  return (
    allowShowAccountSetting &&
    account &&
    state.activeTab?.origin &&
    isEvmAccount &&
    connectedAccounts.length > 0 &&
    !connectedAccounts.some((address) => address === account.address)
  );
}

/**
 * Retrieves user preference to never see the "Switched Network" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
export function selectSwitchedNetworkNeverShowMessage(state: State): boolean {
  return Boolean(state.metamask.switchedNetworkNeverShowMessage);
}

/**
 * Retrieves user preference to see the "New SRP Added" toast
 *
 * @param state - Redux state object.
 * @returns Boolean preference value
 */
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
export function selectNewSrpAdded(state: State): boolean {
  return Boolean(state.appState.showNewSrpAddedToast);
}
///: END:ONLY_INCLUDE_IF

export function selectNftDetectionEnablementToast(state: State): boolean {
  return Boolean(state.appState?.showNftDetectionEnablementToast);
}
