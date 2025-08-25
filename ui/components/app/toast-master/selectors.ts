import { InternalAccount } from '@metamask/keyring-internal-api';
import { isEvmAccountType } from '@metamask/keyring-api';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';
import { getAlertEnabledness } from '../../../ducks/metamask/metamask';
import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../../helpers/constants/survey';
import {
  getAllPermittedAccountsForCurrentTab,
  isSolanaAccount,
} from '../../../selectors';
import { MetaMaskReduxState } from '../../../store/store';
import { PasswordChangeToastType } from '../../../../shared/constants/app-state';
import { getIsPrivacyToastRecent } from './utils';

type State = {
  appState: Partial<
    Pick<
      MetaMaskReduxState['appState'],
      | 'showNftDetectionEnablementToast'
      | 'showNewSrpAddedToast'
      | 'showPasswordChangeToast'
      | 'showCopyAddressToast'
      | 'showLockFailureToast'
    >
  >;
  metamask: Partial<
    Pick<
      MetaMaskReduxState['metamask'],
      | 'newPrivacyPolicyToastClickedOrClosed'
      | 'newPrivacyPolicyToastShownDate'
      | 'onboardingDate'
      | 'surveyLinkLastClickedOrClosed'
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

export function selectShowLockFailureToast(
  state: Pick<State, 'appState'>,
): boolean {
  return Boolean(state.appState.showLockFailureToast);
}
