import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

export const ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['MoneyAccountAvailabilityService:getAvailability'],
  events: [],
});

export type RouteMessengerInstance = RouteMessengerFromCapabilities<
  typeof ALLOWED_CAPABILITIES
>;
