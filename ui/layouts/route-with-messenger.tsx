import React, { ReactNode, useRef } from 'react';
import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import {
  LegacyRouteMessengerProvider,
  RouteMessengerContext,
} from '../contexts/route-messenger';
import { useUIMessenger } from '../contexts/ui-messenger';
import {
  createRouteMessenger,
  type RouteMessenger,
} from '../messengers/route-messenger';

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
export const RouteWithMessenger = ({
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
  if (!routeMessengerRef.current) {
    routeMessengerRef.current = createRouteMessenger({
      path,
      uiMessenger,
      capabilities,
    });
  }

  const routeMessenger = routeMessengerRef.current;

  return (
    <RouteMessengerContext.Provider value={routeMessenger}>
      <LegacyRouteMessengerProvider>{children}</LegacyRouteMessengerProvider>
    </RouteMessengerContext.Provider>
  );
};
