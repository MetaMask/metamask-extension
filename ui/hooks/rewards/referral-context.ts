import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Background actions that read or advance the pending Money referral context.
 *
 * The context is captured and stored by the background; the UI may only read
 * it or move it forward. Keep the action names here so the background
 * connection, the route-scoped messenger, and the capability list cannot drift
 * apart.
 */
export const MoneyReferralContextAction = {
  getPending: 'RewardsMoneyController:getPendingReferralContext',
  continue: 'RewardsMoneyController:continueReferralContext',
  drop: 'RewardsMoneyController:dropReferralContext',
  take: 'RewardsMoneyController:takeReferralContext',
  answer: 'RewardsMoneyController:answerReferralContext',
} as const;

/**
 * Typed client for routes that are not wrapped in a referral route messenger.
 * The handoff route uses its scoped messenger instead.
 */
export const referralContextClient = {
  getPending: () =>
    submitRequestToBackground(MoneyReferralContextAction.getPending),
  continue: (id: string) =>
    submitRequestToBackground(MoneyReferralContextAction.continue, [id]),
  drop: (id: string) =>
    submitRequestToBackground(MoneyReferralContextAction.drop, [id]),
};
