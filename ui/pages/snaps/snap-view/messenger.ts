import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import { RouteMessenger } from '../../../messengers/route-messenger';

export const ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities({
  actions: ['SnapController:disconnectOrigin', 'SnapController:installSnaps'],
  events: [],
});

export type RouteMessengerInstance = RouteMessenger<
  (typeof ALLOWED_CAPABILITIES)['actions'][number],
  (typeof ALLOWED_CAPABILITIES)['events'][number]
>;
