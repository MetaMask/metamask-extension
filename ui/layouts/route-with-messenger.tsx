import React, { ReactNode, useMemo } from 'react';
import { useMatches } from 'react-router-dom';
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
  const matches = useMatches();
  const uiMessenger = useUIMessenger();

  const routeMessenger = useMemo(() => {
    const lastMatch = matches[matches.length - 1];
    const path = lastMatch?.pathname || '/';

    return createRouteMessenger({ path, uiMessenger, capabilities });
  }, [uiMessenger, capabilities, matches]);

  return (
    <RouteMessengerContext.Provider value={routeMessenger}>
      <LegacyRouteMessengerProvider>{children}</LegacyRouteMessengerProvider>
    </RouteMessengerContext.Provider>
  );
};
