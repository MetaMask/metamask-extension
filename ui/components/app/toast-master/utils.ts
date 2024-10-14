import { PayloadAction } from '@reduxjs/toolkit';
import { ReactFragment } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getSwitchedNetworkDetails } from '../../../selectors';
import { SHOW_NFT_DETECTION_ENABLEMENT_TOAST } from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';
import { selectSwitchedNetworkNeverShowMessage } from './selectors';

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

export function onHomeScreen() {
  const location = useLocation();

  return location.pathname === DEFAULT_ROUTE;
}

export function setSurveyLinkLastClickedOrClosed(time: number) {
  return async () => {
    await submitRequestToBackground('setSurveyLinkLastClickedOrClosed', [time]);
  };
}

export function getShowAutoNetworkSwitchTest() {
  const switchedNetworkDetails = useSelector(getSwitchedNetworkDetails);
  const switchedNetworkNeverShowMessage = useSelector(
    selectSwitchedNetworkNeverShowMessage,
  );

  return switchedNetworkDetails && !switchedNetworkNeverShowMessage;
}
