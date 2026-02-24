//========
// This file defines a context that gives us convenient "global" access to the
// messenger for the current route. We use it in `useMessenger`.
//========

import { createContext, useContext } from 'react';
import { RouteMessenger } from '../messengers/route-messenger';

/**
 * Context that holds the messenger for the current route.
 */
export const RouteMessengerContext = createContext<RouteMessenger | null>(null);

/**
 * Hook to access the messenger for the current route from context.
 *
 * @returns The route messenger in context.
 * @throws If the route messenger has not been set.
 */
export function useRouteMessenger(): RouteMessenger {
  const messenger = useContext(RouteMessengerContext);

  if (!messenger) {
    throw new Error(
      'No messenger is associated with the current route',
    );
  }

  return messenger;
}
