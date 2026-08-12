import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../messengers/route-messenger';

export const RESTORE_VAULT_PASSKEY_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateRegistrationOptions',
      'PasskeyController:generatePostRegistrationAuthenticationOptions',
      'PasskeyController:protectVaultKeyWithPasskey',
    ],
    events: [],
  });

export type RestoreVaultPasskeyRouteMessenger = RouteMessengerFromCapabilities<
  typeof RESTORE_VAULT_PASSKEY_ROUTE_CAPABILITIES
>;
