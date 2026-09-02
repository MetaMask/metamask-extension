import { defineAllowedRouteCapabilities } from '../../../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../../../messengers/route-messenger';

export const MONEY_ACCOUNT_WITHDRAW_BUTTON_ALLOWED_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: ['MoneyAccountAvailabilityService:getAvailability'],
    events: [],
  });

export type MoneyAccountWithdrawButtonMessenger =
  RouteMessengerFromCapabilities<
    typeof MONEY_ACCOUNT_WITHDRAW_BUTTON_ALLOWED_CAPABILITIES
  >;
