import { defineExcludedCapabilities } from './helpers';

// By default, all actions and events are allowed. If there an action or event
// you think should NOT be accessible from the UI, update this.
export const EXCLUDED_CAPABILITIES = defineExcludedCapabilities({
  actions: [
    'KeyringController:addKeyring',
    'KeyringController:getKeyringsByType',
    'KeyringController:getKeyringForAccount',
    'KeyringController:withController',
    'KeyringController:withKeyring',
    'KeyringController:withKeyringUnsafe',
    'KeyringController:withKeyringV2',
    'KeyringController:withKeyringV2Unsafe',
  ],
  events: [],
});
