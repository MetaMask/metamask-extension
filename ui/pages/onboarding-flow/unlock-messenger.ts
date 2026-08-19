import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const ONBOARDING_UNLOCK_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'LegacyBackgroundApiService:unlockWithPasskey',
    ],
    events: [],
  });
