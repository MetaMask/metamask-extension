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
 * What rebate, if any, a confirmation screen shows. Writes nothing. The
 * profile is the bearer token's; the body never names one.
 *
 * A refusal, or a `200` whose body is not a quote, rejects with
 * {@link RewardsMoneyRebateQuoteError}; a `401` with
 * {@link RewardsMoneyAuthorizationError}. A timeout or a network failure
 * rejects with a plain `Error`.
 *
 * @param body - The product and, for swaps, the fee leg of the quote.
 * @returns The rebate quote.
 */
export type RewardsMoneyDataServiceGetRebateQuoteAction = {
  type: `RewardsMoneyDataService:getRebateQuote`;
  handler: RewardsMoneyDataService['getRebateQuote'];
};

/**
 * Union of all RewardsMoneyDataService action types.
 */
export type RewardsMoneyDataServiceMethodActions =
  | RewardsMoneyDataServiceGetReferralMeAction
  | RewardsMoneyDataServiceValidateReferralCodeAction
  | RewardsMoneyDataServiceRegisterRefereeAction
  | RewardsMoneyDataServiceGetRebateQuoteAction;
