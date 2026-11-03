import { defineExcludedCapabilities } from './helpers';

export const EXCLUDED_CAPABILITIES = defineExcludedCapabilities({
  actions: [
    'PasskeyController:retrieveVaultKeyWithPasskey',
    'PasskeyController:renewVaultKeyProtection',
    'PasskeyController:unlockWithPasskey',
    'PasskeyController:changePasswordWithPasskeyVerification',
    'PasskeyController:exportSeedPhraseWithPasskey',
    'PasskeyController:clearState',
    'PasskeyController:destroy',
  ],
  events: [],
});
