import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

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
    ],
    events: [],
  });

export type RewardsMoneyInviteMessenger = RouteMessengerFromCapabilities<
  typeof REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES
>;
