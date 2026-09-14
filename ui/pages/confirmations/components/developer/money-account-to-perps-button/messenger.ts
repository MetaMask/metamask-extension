import { defineAllowedRouteCapabilities } from '../../../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../../../messengers/route-messenger';

export const MONEY_ACCOUNT_TO_PERPS_BUTTON_ALLOWED_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: ['MoneyAccountAvailabilityService:getAvailability'],
    events: [],
  });

export type MoneyAccountToPerpsButtonMessenger = RouteMessengerFromCapabilities<
  typeof MONEY_ACCOUNT_TO_PERPS_BUTTON_ALLOWED_CAPABILITIES
>;
