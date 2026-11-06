import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';
import { MoneyReferralContextAction } from './referral-context';

/**
 * Actions the money invite sheet may call on RewardsMoneyController.
 * Rebate quotes stay off this route; a confirmation screen allows those
 * on its own messenger.
 */
export const REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'RewardsMoneyController:getReferralMe',
      'RewardsMoneyController:validateReferralCode',
      'RewardsMoneyController:registerReferee',
      MoneyReferralContextAction.getPending,
      MoneyReferralContextAction.continue,
      MoneyReferralContextAction.take,
    ],
    events: [],
  });

export type RewardsMoneyInviteMessenger = RouteMessengerFromCapabilities<
  typeof REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES
>;

/**
 * Actions the Swaps rebate banner may call on RewardsMoneyController.
 */
export const SWAPS_REBATE_ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities(
  {
    actions: ['RewardsMoneyController:getSwapsRebateQuote'],
    events: [],
  },
);

export type SwapsRebateMessenger = RouteMessengerFromCapabilities<
  typeof SWAPS_REBATE_ALLOWED_CAPABILITIES
>;
