//========
// This file defines a helper which allows engineers to set up a route with a
// messenger, a HOC for wrapping the route, and a hook for accessing the
// messenger within route children, all in one bundle.
//========

import React, {
  ComponentType,
  Component,
  createContext,
  useContext,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import {
  createRouteMessenger,
  RouteMessenger,
} from '../messengers/route-messenger';
import {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { useUIMessenger } from '../contexts/ui-messenger';
import {
  LegacyRouteMessengerProvider,
  RouteMessengerContext,
} from '../contexts/route-messenger';

export function createRouteMessengerManager<
  const ActionTypes extends UIMessengerActions['type'],
  const EventTypes extends UIMessengerEvents['type'],
>(capabilities: { actions: ActionTypes[]; events: EventTypes[] }) {
  type RouteMessengerInstance = RouteMessenger<ActionTypes, EventTypes>;

  const RouteMessengerInstanceContext =
    createContext<RouteMessengerInstance | null>(null);

  /**
   * Utility component which provides the messenger to this route. Designed
   * specifically for legacy class components.
   *
   * @see {@link RouteWithMessenger}
   */
  class LegacyRouteMessengerInstanceProvider extends Component {
    static propTypes = {
      children: PropTypes.node,
    };

    static defaultProps = {
      children: undefined,
    };

    static contextType = RouteMessengerInstanceContext;

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

  /**
   * Hook that returns the messenger in context for this route.
   */
  function useMessenger(): RouteMessengerInstance {
    const messenger = useContext(RouteMessengerInstanceContext);
    if (!messenger) {
      throw new Error('No messenger is set');
    }
    return messenger;
  }

  /**
   * Higher-order component that creates a route messenger and provides it
   * via context to the wrapped component tree. Components within the tree
   * can access the messenger via `useMessenger()`.
   *
   * When called with a messenger as the second argument, that messenger is
   * used directly instead of creating one from the UI messenger. This is
   * primarily useful in tests.
   *
   * @param Component - The component to wrap.
   * @param messenger - Optional messenger to use directly (e.g. in tests).
   */
  function withMessenger(
    Component: ComponentType<object>,
    messenger?: RouteMessengerInstance,
  ) {
    if (messenger) {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      return function ComponentWithMessenger(props: object) {
        return (
          <RouteMessengerContext.Provider value={messenger}>
            <LegacyRouteMessengerProvider>
              <RouteMessengerInstanceContext.Provider value={messenger}>
                <LegacyRouteMessengerInstanceProvider>
                  <Component {...props} />
                </LegacyRouteMessengerInstanceProvider>
              </RouteMessengerInstanceContext.Provider>
            </LegacyRouteMessengerProvider>
          </RouteMessengerContext.Provider>
        );
      };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    return function ComponentWithMessenger(props: object) {
      const uiMessenger = useUIMessenger();

      const routeMessenger = useMemo(() => {
        return createRouteMessenger({ uiMessenger, capabilities });
      }, [uiMessenger]);

      return (
        <RouteMessengerInstanceContext.Provider value={routeMessenger}>
          <LegacyRouteMessengerProvider>
            <RouteMessengerInstanceContext.Provider value={routeMessenger}>
              <LegacyRouteMessengerInstanceProvider>
                <Component {...props} />
              </LegacyRouteMessengerInstanceProvider>
            </RouteMessengerInstanceContext.Provider>
          </LegacyRouteMessengerProvider>
        </RouteMessengerInstanceContext.Provider>
      );
    };
  }

  return { capabilities, useMessenger, withMessenger };
}
