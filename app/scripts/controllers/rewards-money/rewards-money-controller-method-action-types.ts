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
 * Rebate a swaps confirmation screen should show. The bridge quote decides
 * fee-token eligibility. Not cached: the rate has to disappear the moment
 * an operator ends the window, and a different quote can name a different
 * fee token.
 *
 * Pass the `quote` of the bridge `QuoteResponse`, not the response. Only
 * its `feeData.metabridge` is sent.
 *
 * A refusal rejects with `RewardsMoneyRebateQuoteError`, a `401` with
 * `RewardsMoneyAuthorizationError`. A timeout or a network failure rejects
 * with a plain `Error`. A `503` (`failure: 'UNAVAILABLE'`) is a busy pod:
 * show no rebate row, do not request another quote for this screen, and
 * leave the button disabled until `retryAfterSeconds` has elapsed. The
 * body reason for that shed is `SERVER_BUSY`.
 *
 * @param quote - The bridge quote the confirmation screen holds.
 * @returns The rebate to show; `eligible: false` means no rebate row.
 */
export type RewardsMoneyControllerGetSwapsRebateQuoteAction = {
  type: `RewardsMoneyController:getSwapsRebateQuote`;
  handler: RewardsMoneyController['getSwapsRebateQuote'];
};

/**
 * Rebate a perps confirmation screen should show. `trade` is optional and
 * the server drops it today; the answer does not depend on it. A trade the
 * server would refuse (see {@link PerpsRebateTrade}) is left out rather
 * than sent, so it cannot turn the quote into a `400`.
 *
 * A refusal rejects with `RewardsMoneyRebateQuoteError`, a `401` with
 * `RewardsMoneyAuthorizationError`. A timeout or a network failure rejects
 * with a plain `Error`. A `503` (`failure: 'UNAVAILABLE'`) is a busy pod:
 * show no rebate row, do not request another quote for this screen, and
 * leave the button disabled until `retryAfterSeconds` has elapsed. The
 * body reason for that shed is `SERVER_BUSY`.
 *
 * @param trade - What the user is about to trade, when known.
 * @returns The rebate to show; `eligible: false` means no rebate row.
 */
export type RewardsMoneyControllerGetPerpsRebateQuoteAction = {
  type: `RewardsMoneyController:getPerpsRebateQuote`;
  handler: RewardsMoneyController['getPerpsRebateQuote'];
};

/**
 * Union of all RewardsMoneyController action types.
 */
export type RewardsMoneyControllerMethodActions =
  | RewardsMoneyControllerGetReferralMeAction
  | RewardsMoneyControllerValidateReferralCodeAction
  | RewardsMoneyControllerRegisterRefereeAction
  | RewardsMoneyControllerGetSwapsRebateQuoteAction
  | RewardsMoneyControllerGetPerpsRebateQuoteAction;
