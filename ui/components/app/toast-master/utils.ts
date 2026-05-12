import { SET_SHOW_INFURA_SWITCH_TOAST } from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';

/**
 * Returns true if the privacy policy toast was shown either never, or less than a day ago.
 *
 * @param newPrivacyPolicyToastShownDate
 * @returns true if the privacy policy toast was shown either never, or less than a day ago
 */
export function getIsPrivacyToastRecent(
  newPrivacyPolicyToastShownDate?: number | null,
): boolean {
  if (!newPrivacyPolicyToastShownDate) {
    return true;
  }

  const currentDate = new Date();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const newPrivacyPolicyToastShownDateObj = new Date(
    newPrivacyPolicyToastShownDate,
  );
  const toastWasShownLessThanADayAgo =
    currentDate.valueOf() - newPrivacyPolicyToastShownDateObj.valueOf() <
    oneDayInMilliseconds;

  return toastWasShownLessThanADayAgo;
}

export function setNewPrivacyPolicyToastShownDate(time: number) {
  submitRequestToBackgroundAndCatch('setNewPrivacyPolicyToastShownDate', [
    time,
  ]);
}

export function setNewPrivacyPolicyToastClickedOrClosed() {
  submitRequestToBackgroundAndCatch('setNewPrivacyPolicyToastClickedOrClosed');
}

// May move this to a different file after discussion with team
export function submitRequestToBackgroundAndCatch(
  method: string,

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[],
) {
  submitRequestToBackground(method, args)?.catch((error) => {
    console.error('Error caught in submitRequestToBackground', error);
  });
}

export function setShowInfuraSwitchToast(value: boolean) {
  return {
    type: SET_SHOW_INFURA_SWITCH_TOAST,
    payload: value,
  };
}

export function setShieldPausedToastLastClickedOrClosed(time: number) {
  submitRequestToBackgroundAndCatch('setShieldPausedToastLastClickedOrClosed', [
    time,
  ]);
}

export function setShieldEndingToastLastClickedOrClosed(time: number) {
  submitRequestToBackgroundAndCatch('setShieldEndingToastLastClickedOrClosed', [
    time,
  ]);
}

export function setPna25Acknowledged(acknowledged: boolean) {
  submitRequestToBackgroundAndCatch('setPna25Acknowledged', [acknowledged]);
}

export function dismissSidePanelMigrationToast() {
  submitRequestToBackgroundAndCatch('dismissSidePanelMigrationToast');
}
