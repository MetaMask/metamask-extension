/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { RewardsMoneyController } from './rewards-money-controller';

/**
 * Loads referral me for the current Hydra profile.
 *
 * @param params - Pass `forceFresh` to skip the in-memory cache.
 * @returns The referral-me payload.
 */
export type RewardsMoneyControllerGetReferralMeAction = {
  type: `RewardsMoneyController:getReferralMe`;
  handler: RewardsMoneyController['getReferralMe'];
};

/**
 * Checks a referral code without authenticating.
 *
 * @param code - The referral code to validate.
 * @returns Whether the server accepts the code.
 */
export type RewardsMoneyControllerValidateReferralCodeAction = {
  type: `RewardsMoneyController:validateReferralCode`;
  handler: RewardsMoneyController['validateReferralCode'];
};

/**
 * Registers the session profile as a referee for `code`.
 *
 * @param params - The referral code.
 */
export type RewardsMoneyControllerRegisterRefereeAction = {
  type: `RewardsMoneyController:registerReferee`;
  handler: RewardsMoneyController['registerReferee'];
};

/**
 * Union of all RewardsMoneyController action types.
 */
export type RewardsMoneyControllerMethodActions = RewardsMoneyControllerGetReferralMeAction | RewardsMoneyControllerValidateReferralCodeAction | RewardsMoneyControllerRegisterRefereeAction;
