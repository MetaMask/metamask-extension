//========
// This file defines `useMessenger`, which is used in React components and hooks
// to access the messenger for the current route.
//========

import { useRouteMessenger } from '../contexts/route-messenger';
import type { RouteMessenger } from '../messengers/route-messenger';
import type {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';

/**
 * Use this hook to access the messenger that corresponds to the current route.
 * You can then use the messenger to call actions and subscribe to events that
 * the route has permission to access.
 *
 * @param args - The arguments to this function.
 * @param args.actions - The list of action types (e.g.
 * `NetworkController:addNetwork`) that you want to use in your component or
 * hook.
 * @param args.events - The list of event types (e.g.
 * `NetworkController:networkAdded`) that you want to use in your component or
 * hook.
 * @returns The route messenger typed with only the specified actions/events.
 * @throws If no messenger has been defined for the current route, or if the
 * messenger doesn't have the requested actions or events.
 * @example
 * ```typescript
 * function NetworkList() {
 *   const messenger = useMessenger({
 *     actions: ['NetworkController:addNetwork'],
 *   });
 *
 *   const onAddNetworkClick = () => {
 *     await messenger.call('NetworkController:addNetwork', ...);
 *   }
 *
 *   return (
 *     <button onClick={onAddNetworkClick}>Add Sepolia</button>
 *   ):
 * }
 * ```
 */
export function useMessenger<
  ActionTypes extends UIMessengerActions['type'] = never,
  EventTypes extends UIMessengerEvents['type'] = never,
>({
  actions = [],
  events = [],
}: {
  actions?: ActionTypes[];
  events?: EventTypes[];
}): RouteMessenger<
  Extract<UIMessengerActions, { type: ActionTypes }>,
  Extract<UIMessengerEvents, { type: EventTypes }>
> {
  const routeMessenger = useRouteMessenger();

  // Because we're using context, all we're able to say at this point is that we
  // have *some* kind of route messenger, but we don't know what capabilities it
  // has. So we need to check.
  for (const actionType of actions) {
    if (!routeMessenger.isActionHandlerRegistered(actionType)) {
      throw new Error(
        `Route messenger does not support the action '${actionType}'`,
      );
    }
  }
  for (const eventType of events) {
    if (!routeMessenger.hasEventSubscriptions(eventType)) {
      throw new Error(
        `Route messenger does not support the event '${eventType}'`,
      );
    }
  }

  // Because of the runtime check above, we can safely make a typecast.
  return routeMessenger as RouteMessenger<
    Extract<UIMessengerActions, { type: ActionTypes }>,
    Extract<UIMessengerEvents, { type: EventTypes }>
  >;
}
