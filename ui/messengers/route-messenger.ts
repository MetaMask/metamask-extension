import { Messenger } from '@metamask/messenger';
import type { ExtractActionParameters } from '@metamask/messenger';
import type {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from './ui-messenger';

/**
 * Namespace for route messengers.
 *
 * All route messengers share this namespace since only one route is active at a
 * time. (This is purely decorative because we don't plan on registering actions
 * directly on routes anyway.)
 */
export const ROUTE_MESSENGER_NAMESPACE = 'Route';

/**
 * A messenger that represents a route.
 *
 * This type is intentionally generic (a bit unusual for messenger "instance"
 * types) because each route gets its own messenger (the "route messenger" isn't
 * a singleton as is the case for controllers and services).
 */
export type RouteMessenger<
  ActionTypes extends UIMessengerActions['type'] = UIMessengerActions['type'],
  EventTypes extends UIMessengerEvents['type'] = UIMessengerEvents['type'],
> = Messenger<
  typeof ROUTE_MESSENGER_NAMESPACE,
  Extract<UIMessengerActions, { type: ActionTypes }>,
  Extract<UIMessengerEvents, { type: EventTypes }>
>;

/**
 * Derive a messenger for a route from the UI messenger.
 *
 * This is used when defining routes (that is, each route gets its own
 * messenger).
 *
 * @param args - Arguments for this function.
 * @param args.uiMessenger - The parent UI messenger.
 * @param args.capabilities - Capabilities to delegate from the UI messenger.
 * @param args.capabilities.actions - Action types to delegate from the UI
 * messenger.
 * @param args.capabilities.events - Event types to delegate from the UI
 * messenger.
 * @returns A messenger with access to the specified actions and events.
 */
export function createRouteMessenger<
  ActionTypes extends UIMessengerActions['type'],
  EventTypes extends UIMessengerEvents['type'],
>({
  uiMessenger,
  capabilities: { actions = [], events = [] },
}: {
  uiMessenger: UIMessenger;
  capabilities: {
    actions?: ActionTypes[];
    events?: EventTypes[];
  };
}): RouteMessenger<ActionTypes, EventTypes> {
  const routeMessenger = new Messenger<
    typeof ROUTE_MESSENGER_NAMESPACE,
    UIMessengerActions,
    UIMessengerEvents
  >({
    namespace: ROUTE_MESSENGER_NAMESPACE,
    parent: uiMessenger,
  });

  if (actions.length === 0 && events.length === 0) {
    throw new Error('There are no actions or events to delegate.');
  }

  // `UIMessenger` overrides call() rather than registering handlers in its
  // action map, so `uiMessenger.delegate()` would fail: It looks up handlers
  // from the parent's `#actions` map, which is always empty on `UIMessenger`.
  // Instead, we register handlers directly on the route messenger that call
  // through to `uiMessenger.call()`, which is what actually forwards the call
  // to the background.
  for (const actionType of actions) {
    routeMessenger._internalRegisterDelegatedActionHandler(
      actionType,
      (
        ...args: ExtractActionParameters<UIMessengerActions, typeof actionType>
      ) => uiMessenger.call(actionType, ...args) as never,
    );
  }

  if (events.length > 0) {
    uiMessenger.delegate({
      messenger: routeMessenger,
      events,
    });
  }

  return routeMessenger;
}
