import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';

export const MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: ['MoneyAccountAvailabilityService:getAvailability'],
    events: [],
  });
