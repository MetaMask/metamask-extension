import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const UNLOCK_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateAuthenticationOptions',
    'LegacyBackgroundApiService:unlockWithPasskey',
  ],
  events: [],
});
