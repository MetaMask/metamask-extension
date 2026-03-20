/**
 * Route messenger context — gives components access to the current route's
 * scoped messenger and its declared capabilities.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import { createContext, useContext } from 'react';
import type { RouteMessenger } from '../messengers/route-messenger';

export type DelegatedCapabilities = {
  events: string[];
};

type RouteMessengerContextValue = {
  messenger: RouteMessenger;
  delegated: DelegatedCapabilities;
};

export const RouteMessengerContext =
  createContext<RouteMessengerContextValue | null>(null);

export function useRouteMessenger(): RouteMessengerContextValue {
  const value = useContext(RouteMessengerContext);

  if (!value) {
    throw new Error(
      'No messenger is associated with the current route. ' +
        'Add a `messenger` config to the route definition in createRouteWithLayout().',
    );
  }

  return value;
}
