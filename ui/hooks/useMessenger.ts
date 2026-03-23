/**
 * Hook to access the current route's messenger with compile-time and runtime
 * capability validation.
 *
 * Components declare the events they need:
 *
 * @example
 * ```typescript
 * const messenger = useMessenger({
 *   events: ['SpotPricesSyncService:spotPricesUpdated'],
 * })
 * messenger.subscribe('SpotPricesSyncService:spotPricesUpdated', handler)
 * ```
 *
 * If the route hasn't declared that event in its `messenger.events` config,
 * this throws at runtime. At compile time, the returned messenger is typed to
 * only the requested event subset — subscribing to undeclared events is a type
 * error.
 *
 * Production: the runtime check uses `routeMessenger.hasEventSubscriptions()`
 * from the @metamask/messenger patch. This PoC validates against the delegated
 * capabilities list stored in context by RouteWithMessenger.
 *
 * @param args - The arguments to this function.
 * @param args.events - The list of event types that the component needs.
 * @returns The route messenger typed with only the specified events.
 * @throws If no messenger has been defined for the current route, or if the
 * messenger doesn't have the requested events.
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import { useRouteMessenger } from '../contexts/route-messenger';
import type { RouteMessenger } from '../messengers/route-messenger';
import type { UIMessengerEvents } from '../messengers/ui-messenger';

export function useMessenger<
  EventTypes extends UIMessengerEvents['type'] = never,
>({
  events = [],
}: {
  events?: EventTypes[];
}): RouteMessenger<never, Extract<UIMessengerEvents, { type: EventTypes }>> {
  const { messenger: routeMessenger, delegated } = useRouteMessenger();

  // Runtime validation: check that each requested event was declared in the
  // route's messenger config and delegated to this route's messenger.
  for (const eventType of events) {
    if (!delegated.events.includes(eventType)) {
      throw new Error(
        `Route messenger does not support the event '${eventType}'. ` +
          "Add it to the route's RouteWithMessenger events list.",
      );
    }
  }

  return routeMessenger as RouteMessenger<
    never,
    Extract<UIMessengerEvents, { type: EventTypes }>
  >;
}
