//========
// Each route gets its own messenger. This file allows you to wrap a Route
// component, and a messenger will be created automatically with the given
// actions and events.
//========

import React, { ReactNode, useMemo } from 'react';
import { Messenger } from '@metamask/messenger';
import {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { RouteMessengerContext } from '../contexts/route-messenger';
import {
  ROUTE_MESSENGER_NAMESPACE,
  RouteMessenger,
} from '../messengers/route-messenger';
import { useUIMessenger } from '../contexts/ui-messenger';

/**
 * Derives a messenger for a route from the UI messenger.
 *
 * This is used when defining routes (that is, each route gets its own
 * messenger).
 *
 * @param args - Arguments for this function.
 * @param args.uiMessenger - The parent UI messenger.
 * @param args.actions - Action types to delegate from the UI messenger.
 * @param args.events - Event types to delegate from the UI messenger.
 * @returns A messenger with access to the specified actions and events.
 */
function createRouteMessenger({
  uiMessenger,
  actions = [],
  events = [],
}: {
  uiMessenger: UIMessenger;
  actions?: UIMessengerActions['type'][];
  events?: UIMessengerEvents['type'][];
}): RouteMessenger {
  // Note that this is a bit different than how messengers are defined for
  // controllers and services. Here we accept all of the same actions and events
  // that UIMessenger also accepts. The narrowing of these actions and events
  // actually happens when a messenger is pulled from the context in
  // `useMessenger`.
  const routeMessenger = new Messenger<
    typeof ROUTE_MESSENGER_NAMESPACE,
    UIMessengerActions,
    UIMessengerEvents,
    UIMessenger
  >({
    namespace: ROUTE_MESSENGER_NAMESPACE,
    parent: uiMessenger,
  });

  if (actions.length > 0 || events.length > 0) {
    uiMessenger.delegate({
      messenger: routeMessenger,
      actions,
      events,
    });
  } else {
    throw new Error('There are no actions or events to delegate');
  }

  return routeMessenger;
}

/**
 * Utility component which creates a messenger representing a route and
 * provides it to children via context.
 *
 * @param props - Component props.
 * @param props.actions - Action types to delegate to the route messenger.
 * @param props.events - Event types to delegate to the route messenger.
 * @param props.children - Child components.
 */
export const RouteWithMessenger = ({
  actions,
  events,
  children,
}: {
  actions?: UIMessengerActions['type'][];
  events?: UIMessengerEvents['type'][];
  children: ReactNode;
}) => {
  const uiMessenger = useUIMessenger();

  const routeMessenger = useMemo(() => {
    return createRouteMessenger({ uiMessenger, actions, events });
  }, [uiMessenger, actions, events]);

  return (
    <RouteMessengerContext.Provider value={routeMessenger}>
      {children}
    </RouteMessengerContext.Provider>
  );
};
