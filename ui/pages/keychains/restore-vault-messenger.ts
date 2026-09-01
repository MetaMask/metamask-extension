import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const RESTORE_VAULT_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateRegistrationOptions',
    'PasskeyController:generatePostRegistrationAuthenticationOptions',
    'PasskeyController:protectVaultKeyWithPasskey',
  ],
  events: [],
});
