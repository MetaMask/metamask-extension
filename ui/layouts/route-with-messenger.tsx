//========
// Each route gets its own messenger. This file allows you to wrap a Route
// component, and a messenger will be created automatically with the given
// actions and events.
//========

import React, { ReactNode, useMemo } from 'react';
import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import {
  LegacyRouteMessengerProvider,
  RouteMessengerContext,
} from '../contexts/route-messenger';
import { useUIMessenger } from '../contexts/ui-messenger';
import { createRouteMessenger } from '../messengers/route-messenger';

/**
 * Utility component which creates a messenger representing a route and
 * provides it to children via context.
 *
 * @param props - Component props.
 * @param props.capabilities - Capabilities to delegate to the route messenger.
 * @param props.capabilities.actions - Action types to delegate to the route
 * messenger.
 * @param props.capabilities.events - Event types to delegate to the route
 * messenger.
 * @param props.children - Child components.
 */
export const RouteWithMessenger = ({
  capabilities,
  children,
}: {
  capabilities: {
    actions?: UIMessengerActions['type'][];
    events?: UIMessengerEvents['type'][];
  };
  children: ReactNode;
}) => {
  const uiMessenger = useUIMessenger();

  const routeMessenger = useMemo(() => {
    return createRouteMessenger({ uiMessenger, capabilities });
  }, [uiMessenger, capabilities]);

  return (
    <RouteMessengerContext.Provider value={routeMessenger}>
      <LegacyRouteMessengerProvider>{children}</LegacyRouteMessengerProvider>
    </RouteMessengerContext.Provider>
  );
};
