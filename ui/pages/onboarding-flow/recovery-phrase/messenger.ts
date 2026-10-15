import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';

export const REVEAL_RECOVERY_PHRASE_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
    ],
    events: [],
  });
