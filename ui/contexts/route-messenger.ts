import { Component, createContext, useContext } from 'react';
import PropTypes from 'prop-types';

import { RouteMessenger } from '../messengers/route-messenger';

/**
 * Context that holds the messenger for the current route.
 *
 * @see {@link RouteWithMessenger}
 */
export const RouteMessengerContext = createContext<RouteMessenger | null>(null);

/**
 * Hook to access the messenger for the current route from context.
 *
 * @returns The route messenger in context.
 * @throws If the route messenger has not been set.
 */
export function useRouteMessenger(): RouteMessenger {
  const messenger = useContext(RouteMessengerContext);

  if (!messenger) {
    throw new Error(
      'useRouteMessenger must be used within a route messenger context',
    );
  }

  return messenger;
}

/**
 * Utility component which provides messengers to routes. Designed specifically
 * for legacy class components.
 *
 * @see {@link RouteWithMessenger}
 */
export class LegacyRouteMessengerProvider extends Component {
  static propTypes = {
    children: PropTypes.node,
  };

  static defaultProps = {
    children: undefined,
  };

  static contextType = RouteMessengerContext;

  static childContextTypes = {
    messenger: PropTypes.object,
  };

  getChildContext() {
    return {
      messenger: this.context,
    };
  }

  render() {
    return this.props.children;
  }
}
