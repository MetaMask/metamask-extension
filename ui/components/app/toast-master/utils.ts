import { PayloadAction } from '@reduxjs/toolkit';
import { ReactFragment } from 'react';
import { SHOW_NFT_DETECTION_ENABLEMENT_TOAST } from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';

/**
 * Returns true if the privacy policy toast was shown either never, or less than a day ago.
 *
 * @param newPrivacyPolicyToastShownDate
 * @returns true if the privacy policy toast was shown either never, or less than a day ago
 */
export function getIsPrivacyToastRecent(
  newPrivacyPolicyToastShownDate?: number,
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
  submitRequestToBackground('setNewPrivacyPolicyToastShownDate', [time]);
}

export function setNewPrivacyPolicyToastClickedOrClosed() {
  submitRequestToBackground('setNewPrivacyPolicyToastClickedOrClosed');
}

export function setShowNftDetectionEnablementToast(
  value: boolean,
): PayloadAction<string | ReactFragment | undefined> {
  return {
    type: SHOW_NFT_DETECTION_ENABLEMENT_TOAST,
    payload: value,
  };
}

export function setSwitchedNetworkNeverShowMessage() {
  submitRequestToBackground('setSwitchedNetworkNeverShowMessage', [true]);
}

export function setSurveyLinkLastClickedOrClosed(time: number) {
  return async () => {
    await submitRequestToBackground('setSurveyLinkLastClickedOrClosed', [time]);
  };
}
