import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';

export const networkConnectionBannerCapabilities =
  defineAllowedRouteCapabilities({
    actions: [
      'NetworkConnectionBannerController:switchToDefaultInfuraRpcEndpoint',
    ],
    events: [],
  });

export type RouteMessengerInstance = RouteMessengerFromCapabilities<
  typeof networkConnectionBannerCapabilities
>;
