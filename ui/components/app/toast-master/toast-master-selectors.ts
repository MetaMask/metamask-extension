import { PayloadAction } from '@reduxjs/toolkit';
import { ReactFragment } from 'react';
import { PRIVACY_POLICY_DATE } from '../../../helpers/constants/privacy-policy';
import {
  SURVEY_DATE,
  SURVEY_END_TIME,
  SURVEY_START_TIME,
} from '../../../helpers/constants/survey';
import { SHOW_NFT_DETECTION_ENABLEMENT_TOAST } from '../../../store/actionConstants';
import { submitRequestToBackground } from '../../../store/background-connection';

// TODO: get this into one of the larger definitions of state type
type State = {
  appState?: {
    showNftDetectionEnablementToast?: boolean;
  };
  metamask?: {
    newPrivacyPolicyToastClickedOrClosed?: boolean;
    newPrivacyPolicyToastShownDate?: number;
    onboardingDate?: number;
    showNftDetectionEnablementToast?: boolean;
    surveyLinkLastClickedOrClosed?: number;
  };
};

/**
 * Determines if the survey toast should be shown based on the current time, survey start and end times, and whether the survey link was last clicked or closed.
 *
 * @param state - The application state containing the necessary survey data.
 * @returns True if the current time is between the survey start and end times and the survey link was not last clicked or closed. False otherwise.
 */
export function getShowSurveyToast(state: State): boolean {
  if (state.metamask?.surveyLinkLastClickedOrClosed) {
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
export function getShowPrivacyPolicyToast(state: State): {
  showPrivacyPolicyToast: boolean;
  newPrivacyPolicyToastShownDate?: number;
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

/**
 * Returns true if the privacy policy toast was shown either never, or less than a day ago.
 *
 * @param newPrivacyPolicyToastShownDate
 * @returns true if the privacy policy toast was shown either never, or less than a day ago
 */
function getIsPrivacyToastRecent(
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

export function getNftDetectionEnablementToast(state: State): boolean {
  return Boolean(state.appState?.showNftDetectionEnablementToast);
}

export function setShowNftDetectionEnablementToast(
  value: boolean,
): PayloadAction<string | ReactFragment | undefined> {
  return {
    type: SHOW_NFT_DETECTION_ENABLEMENT_TOAST,
    payload: value,
  };
}
