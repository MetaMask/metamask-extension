import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';

export const PASSKEY_PRF_MIGRATION_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generatePasskeyReplacementRegistrationOptions',
      'PasskeyController:generatePostRegistrationAuthenticationOptions',
      'PasskeyController:completePasskeyReplacement',
      'PasskeyController:cancelPasskeyReplacement',
    ],
    events: [],
  });
