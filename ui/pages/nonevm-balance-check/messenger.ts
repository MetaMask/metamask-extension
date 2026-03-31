//========
// This file defines the allowed capabilities for this route.
//========

import { defineAllowedRouteCapabilities } from '../../helpers/route-messenger-helpers';
import { RouteMessenger } from '../../messengers/route-messenger';

export const ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['AccountsController:setSelectedAccount'],
  events: [],
});

export type RouteMessengerInstance = RouteMessenger<
  (typeof ALLOWED_CAPABILITIES)['actions'][number],
  (typeof ALLOWED_CAPABILITIES)['events'][number]
>;
