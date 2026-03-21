//========
// This file defines the allowed capabilities for this route.
//========

import { RouteMessenger } from '../../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../../helpers/route-messenger-helpers';

export const ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['AppStateController:setMusdConversionEducationSeen'],
  events: [],
});

export type RouteMessengerInstance = RouteMessenger<
  (typeof ALLOWED_CAPABILITIES)['actions'][number],
  (typeof ALLOWED_CAPABILITIES)['events'][number]
>;
