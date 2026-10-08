/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { RewardsMoneyDataService } from './rewards-money-data-service';

/**
 * Loads the signed-in profile's referral persona, copy, and excluded regions.
 *
 * @returns The referral-me payload.
 */
export type RewardsMoneyDataServiceGetReferralMeAction = {
  type: `RewardsMoneyDataService:getReferralMe`;
  handler: RewardsMoneyDataService['getReferralMe'];
};

/**
 * Public code check. Never attaches Authorization.
 *
 * @param code - The referral code to validate.
 * @returns Whether the server accepts the code.
 */
export type RewardsMoneyDataServiceValidateReferralCodeAction = {
  type: `RewardsMoneyDataService:validateReferralCode`;
  handler: RewardsMoneyDataService['validateReferralCode'];
};

/**
 * Enrols the session profile under a referrer's code.
 *
 * @param params - The referral code. The referee is the bearer profile.
 */
export type RewardsMoneyDataServiceRegisterRefereeAction = {
  type: `RewardsMoneyDataService:registerReferee`;
  handler: RewardsMoneyDataService['registerReferee'];
};

/**
 * Union of all RewardsMoneyDataService action types.
 */
export type RewardsMoneyDataServiceMethodActions = RewardsMoneyDataServiceGetReferralMeAction | RewardsMoneyDataServiceValidateReferralCodeAction | RewardsMoneyDataServiceRegisterRefereeAction;
