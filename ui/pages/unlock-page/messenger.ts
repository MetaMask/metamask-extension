import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

export const UNLOCK_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateAuthenticationOptions',
    'LegacyBackgroundApiService:unlockWithPasskey',
  ],
  events: [],
});

export type UnlockRouteMessenger = RouteMessengerFromCapabilities<
  typeof UNLOCK_ROUTE_CAPABILITIES
>;
