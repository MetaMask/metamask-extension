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
import { getRemoteFeatureFlags } from '../../../selectors/remote-feature-flags';
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

  // Instead of using getRemoteFeatureFlags, try this approach:
  // Get the feature flags directly from the state
  const remoteFeatureFlags = state.metamask?.remoteFeatureFlags || {};

  // Safeguard for accessing the property
  const flags =
    typeof remoteFeatureFlags === 'object' && remoteFeatureFlags !== null
      ? remoteFeatureFlags
      : {};

  // Get the specific flag we need
  const policyUpdateDate = String(flags.transactionsPrivacyPolicyUpdate || '');

  // Log the values for debugging
  console.log('Privacy Policy Toast - Feature flag check:', {
    remoteFeatureFlags,
    policyUpdateDate,
    newPrivacyPolicyToastClickedOrClosed,
    newPrivacyPolicyToastShownDate,
    onboardingDate,
  });

  // If the feature flag isn't set or is empty, don't show the toast
  if (!policyUpdateDate) {
    return { showPrivacyPolicyToast: false, newPrivacyPolicyToastShownDate };
  }

  // Create dates and ensure consistent timezone handling
  const newPrivacyPolicyDate = new Date(policyUpdateDate);
  const currentDate = new Date();
  const onboardingDateObj = onboardingDate ? new Date(onboardingDate) : null;

  // Log the exact date values for debugging
  console.log('Date values:', {
    policyUpdateDate,
    newPrivacyPolicyDate: newPrivacyPolicyDate.toISOString(),
    currentDate: currentDate.toISOString(),
    onboardingDate,
    onboardingDateObj: onboardingDateObj?.toISOString(),
  });

  // Compare dates using the timestamp values
  const showPrivacyPolicyToast =
    !newPrivacyPolicyToastClickedOrClosed &&
    currentDate.getTime() >= newPrivacyPolicyDate.getTime() &&
    getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate) &&
    (!onboardingDate || onboardingDate <= newPrivacyPolicyDate.getTime());

  // Log the result for debugging
  console.log('Privacy Policy Toast - Result:', {
    showPrivacyPolicyToast,
    currentDate,
    newPrivacyPolicyDate,
    isDateValid: currentDate.getTime() >= newPrivacyPolicyDate.getTime(),
    isToastRecent: getIsPrivacyToastRecent(newPrivacyPolicyToastShownDate),
    onboardingCheck:
      !onboardingDate || onboardingDate <= newPrivacyPolicyDate.getTime(),
  });

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
