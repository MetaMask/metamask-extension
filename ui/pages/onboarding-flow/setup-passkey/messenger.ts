import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';

export const PASSKEY_SETUP_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateRegistrationOptions',
    'PasskeyController:generatePostRegistrationAuthenticationOptions',
    'PasskeyController:protectVaultKeyWithPasskey',
  ],
  events: [],
});

export type PasskeySetupRouteMessenger = RouteMessengerFromCapabilities<
  typeof PASSKEY_SETUP_ROUTE_CAPABILITIES
>;
