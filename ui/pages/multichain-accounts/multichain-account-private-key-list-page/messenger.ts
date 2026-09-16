import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';

export const PRIVATE_KEY_LIST_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'PasskeyController:exportAccountsWithPasskey',
    ],
    events: [],
  });
