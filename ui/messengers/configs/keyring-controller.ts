//========
// All actions and events for KeyringController that we want to remove from the
// UI would live here.
//========

import { defineExcludedCapabilities } from './helpers';

// By default, all actions and events are allowed. If there an action or event
// you think should NOT be accessible from the UI, update this.
export const EXCLUDED_CAPABILITIES = defineExcludedCapabilities({
  actions: ['KeyringController:withKeyring'],
  events: [],
});
