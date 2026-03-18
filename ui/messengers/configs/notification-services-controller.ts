//========
// All actions and events for NotificationServicesController that we want to
// remove from the UI would live here.
//========

import { defineExcludedCapabilities } from './helpers';

// By default, all actions and events are allowed. If there an action or event
// you think should NOT be accessible from the UI, update this.
export const EXCLUDED_CAPABILITIES = defineExcludedCapabilities({
  actions: [
    // @ts-expect-error This action actually isn't present in the root messenger
    // right now, but after the "expose messenger actions/events" epic is done,
    // it may be
    'NotificationServicesController:init',
  ],
  events: [],
});
