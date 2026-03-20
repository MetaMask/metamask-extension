/**
 * Per-route messenger wrapper — creates a child messenger from the UI messenger
 * with only the events declared for this route.
 *
 * Subscribing to an undeclared event from a component on this route is a
 * compile-time type error (via useMessenger generics) and a runtime error
 * (via useMessenger validation against the delegated events list).
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import React, { type ReactNode, useMemo } from 'react';
import { Messenger } from '@metamask/messenger';
import type {
  UIMessenger,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import {
  RouteMessengerContext,
  type DelegatedCapabilities,
} from '../contexts/route-messenger';
import {
  ROUTE_MESSENGER_NAMESPACE,
  type RouteMessenger,
} from '../messengers/route-messenger';
import { useUIMessenger } from '../contexts/ui-messenger';

/**
 * Creates a route-scoped child messenger that delegates only the declared
 * capabilities from the parent UI messenger.
 *
 * @param args - Arguments for this function.
 * @param args.uiMessenger - The parent UI messenger.
 * @param args.events - Event types to delegate from the UI messenger.
 * @returns A child messenger scoped to this route's declared capabilities.
 */
function createRouteMessenger({
  uiMessenger,
  events = [],
}: {
  uiMessenger: UIMessenger;
  events?: UIMessengerEvents['type'][];
}): RouteMessenger {
  const routeMessenger = new Messenger<
    typeof ROUTE_MESSENGER_NAMESPACE,
    never,
    UIMessengerEvents,
    UIMessenger
  >({
    namespace: ROUTE_MESSENGER_NAMESPACE,
    parent: uiMessenger,
  });

  if (events.length > 0) {
    uiMessenger.delegate({
      messenger: routeMessenger,
      events,
    });
  }

  return routeMessenger as RouteMessenger;
}

/**
 * Utility component which creates a messenger representing a route and
 * provides it to children via context.
 *
 * @param props - Component props.
 * @param props.events - Event types to delegate to the route messenger.
 * @param props.children - Child components.
 */
export const RouteWithMessenger = ({
  events,
  children,
}: {
  events?: UIMessengerEvents['type'][];
  children: ReactNode;
}) => {
  const uiMessenger = useUIMessenger();

  const routeMessenger = useMemo(() => {
    return createRouteMessenger({ uiMessenger, events });
  }, [uiMessenger, events]);

  const delegated: DelegatedCapabilities = useMemo(
    () => ({ events: events ?? [] }),
    [events],
  );

  return (
    <RouteMessengerContext.Provider
      value={{ messenger: routeMessenger, delegated }}
    >
      {children}
    </RouteMessengerContext.Provider>
  );
};
