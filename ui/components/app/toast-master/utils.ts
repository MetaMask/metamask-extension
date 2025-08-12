import { PayloadAction } from '@reduxjs/toolkit';
import { ReactFragment } from 'react';
import {
  SET_SHOW_NEW_SRP_ADDED_TOAST,
  SET_SHOW_PASSWORD_CHANGE_TOAST,
  SET_SHOW_COPY_ADDRESS_TOAST,
  SHOW_NFT_DETECTION_ENABLEMENT_TOAST,
} from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';
import { PasswordChangeToastType } from '../../../../shared/constants/app-state';

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

export function setShowNftDetectionEnablementToast(
  value: boolean,
): PayloadAction<string | ReactFragment | undefined> {
  return {
    type: SHOW_NFT_DETECTION_ENABLEMENT_TOAST,
    payload: value,
  };
}

export function setSurveyLinkLastClickedOrClosed(time: number) {
  submitRequestToBackgroundAndCatch('setSurveyLinkLastClickedOrClosed', [time]);
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

export function setShowNewSrpAddedToast(value: boolean) {
  return {
    type: SET_SHOW_NEW_SRP_ADDED_TOAST,
    payload: value,
  };
}

export function setShowPasswordChangeToast(
  value: PasswordChangeToastType | null,
) {
  return {
    type: SET_SHOW_PASSWORD_CHANGE_TOAST,
    payload: value,
  };
}

export function setShowCopyAddressToast(value: boolean) {
  return {
    type: SET_SHOW_COPY_ADDRESS_TOAST,
    payload: value,
  };
}
