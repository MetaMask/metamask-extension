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
 * Supply a {@link RouteMessenger} type as the type parameter to narrow the
 * returned messenger to only the actions and events you need.
 *
 * @returns The route messenger cast to the requested messenger type.
 * @example
 * ```typescript
 * type NetworkListMessenger = RouteMessenger<
 *   'NetworkController:addNetwork',
 *   never
 * >;
 *
 * function NetworkList() {
 *   const messenger = useMessenger<NetworkListMessenger>();
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
  RouteMessengerInstance extends RouteMessenger<
    UIMessengerActions['type'],
    UIMessengerEvents['type']
  >,
>(): RouteMessengerInstance {
  const routeMessenger = useRouteMessenger();

  // The context only tells us we have *some* kind of route messenger, but not
  // what capabilities it has. We trust the caller's type parameter here — the
  // route configuration is responsible for ensuring the messenger actually
  // supports the requested actions/events.
  return routeMessenger as unknown as RouteMessengerInstance;
}
