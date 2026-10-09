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
 * with a plain `Error`. A `401` is not retried.
 *
 * The confirm button may wait for this first request, for at most 2 to 3
 * seconds. If the quote has not arrived by then, or the request fails,
 * unblock the confirm button and let the user continue with no rebate tag.
 * One quiet retry may run while the screen stays open. Wait
 * `retryAfterSeconds` when the error has one, then add a small random
 * delay: a `503` sends a fixed `Retry-After: 2`, and without that jitter
 * every client retries in the same second. When the header is missing,
 * `retryAfterSeconds` is `undefined` and the caller chooses the wait. Stop
 * after that second attempt, or when the user leaves the screen. A success
 * on the retry shows the rebate tag. The retry does not hold the confirm
 * button. A `429` (`RATE_LIMITED`) shares the profile read budget, 60
 * requests per 30 seconds, with the Earnings reads, so this screen sends
 * the first quote plus that one retry. A `503` (`UNAVAILABLE`) means the
 * server is unavailable, whether the body reason is `SERVER_BUSY` or
 * `JWKS_UNAVAILABLE`.
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
 * with a plain `Error`. A `401` is not retried.
 *
 * The confirm button may wait for this first request, for at most 2 to 3
 * seconds. If the quote has not arrived by then, or the request fails,
 * unblock the confirm button and let the user continue with no rebate tag.
 * One quiet retry may run while the screen stays open. Wait
 * `retryAfterSeconds` when the error has one, then add a small random
 * delay: a `503` sends a fixed `Retry-After: 2`, and without that jitter
 * every client retries in the same second. When the header is missing,
 * `retryAfterSeconds` is `undefined` and the caller chooses the wait. Stop
 * after that second attempt, or when the user leaves the screen. A success
 * on the retry shows the rebate tag. The retry does not hold the confirm
 * button. A `429` (`RATE_LIMITED`) shares the profile read budget, 60
 * requests per 30 seconds, with the Earnings reads, so this screen sends
 * the first quote plus that one retry. A `503` (`UNAVAILABLE`) means the
 * server is unavailable, whether the body reason is `SERVER_BUSY` or
 * `JWKS_UNAVAILABLE`.
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
