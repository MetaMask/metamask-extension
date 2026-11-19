import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const REVEAL_SEED_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateAuthenticationOptions',
    'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
  ],
  events: [],
});
