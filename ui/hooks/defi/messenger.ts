import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

export const DEFI_ROUTE_ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['DeFiPositionsControllerV2:fetchDeFiPositions'],
  events: [],
});

export type DeFiMessenger = RouteMessengerFromCapabilities<
  typeof DEFI_ROUTE_ALLOWED_CAPABILITIES
>;
