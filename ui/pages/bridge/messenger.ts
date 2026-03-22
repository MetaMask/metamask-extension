//========
// This file defines the allowed capabilities for this route.
//========

import { createRouteMessengerManager } from '../../helpers/route-messenger-manager';

export const { capabilities, useMessenger, withMessenger } =
  createRouteMessengerManager({
    actions: ['BridgeController:trackUnifiedSwapBridgeEvent'],
    events: [],
  });
