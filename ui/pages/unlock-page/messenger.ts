import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const UNLOCK_ROUTE_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: [
    'PasskeyController:generateAuthenticationOptions',
    'PasskeyController:generatePasskeyReplacementRegistrationOptions',
    'PasskeyController:generatePostRegistrationAuthenticationOptions',
    'PasskeyController:completePasskeyReplacement',
    'PasskeyController:cancelPasskeyReplacement',
    'LegacyBackgroundApiService:unlockWithPasskey',
    'AppStateController:incrementPasskeyPrfMigrationNoticeCounter',
  ],
  events: [],
});
