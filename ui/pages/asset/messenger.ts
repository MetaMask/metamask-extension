//========
// This file defines the allowed capabilities for this route.
//========

import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';

export const ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['BridgeController:trackUnifiedSwapBridgeEvent'],
  events: [],
});
