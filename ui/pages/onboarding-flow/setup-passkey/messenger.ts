import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';

export const PASSKEY_SETUP_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateRegistrationOptions',
    'PasskeyController:generatePostRegistrationAuthenticationOptions',
    'PasskeyController:protectVaultKeyWithPasskey',
  ],
  events: [],
});
