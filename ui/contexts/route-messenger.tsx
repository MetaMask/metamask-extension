import React, { createContext, ReactNode, useContext, useRef } from 'react';

import {
  createRouteMessenger,
  RouteMessenger,
} from '../messengers/route-messenger';
import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { useUIMessenger } from './ui-messenger';

/**
 * Context that holds the messenger for the current route.
 *
 * @see {@link RouteMessengerProvider}
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
      'useRouteMessenger must be used within a route messenger context',
    );
  }

  return messenger;
}

/**
 * Utility component which creates a messenger representing a route and
 * provides it to children via context.
 *
 * @param props - Component props.
 * @param props.path - The path of the route. This is used for debugging
 * purposes and to ensure that the route messenger's namespace is unique across
 * routes.
 * @param props.capabilities - Capabilities to delegate to the route messenger.
 * @param props.capabilities.actions - Action types to delegate to the route
 * messenger.
 * @param props.capabilities.events - Event types to delegate to the route
 * messenger.
 * @param props.children - Child components.
 */
export const RouteMessengerProvider = ({
  path,
  capabilities,
  children,
}: {
  path: string;
  capabilities: {
    actions?: UIMessengerActions['type'][];
    events?: UIMessengerEvents['type'][];
  };
  children: ReactNode;
}) => {
  const uiMessenger = useUIMessenger();
  const routeMessengerRef = useRef<RouteMessenger | null>(null);

  // `useMemo` doesn't work here because `capabilities` is an object, so we use
  // a ref instead to ensure that we only create the route messenger once.
  // eslint-disable-next-line react-hooks/refs
  if (!routeMessengerRef.current) {
    routeMessengerRef.current = createRouteMessenger({
      path,
      uiMessenger,
      capabilities,
    });
  }

  // See above.
  // eslint-disable-next-line react-hooks/refs
  const routeMessenger = routeMessengerRef.current;

  return (
    <RouteMessengerContext.Provider value={routeMessenger}>
      {children}
    </RouteMessengerContext.Provider>
  );
};
