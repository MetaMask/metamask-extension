import React, { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import Authenticated from '../helpers/higher-order-components/authenticated/authenticated.container';
import Initialized from '../helpers/higher-order-components/initialized';
import type {
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import type { RootLayout } from './root-layout';
import type { LegacyLayout } from './legacy-layout';
import { RouteWithMessenger } from './route-with-messenger';

export type RouteWithLayoutConfig = {
  path: string;
  element?: ReactNode;
  component?: ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  layout:
    | typeof RootLayout
    | typeof LegacyLayout
    | ComponentType<{ children: ReactNode }>;
  authenticated?: boolean;
  initialized?: boolean;
  children?: ReactNode;
  //========
  // When defining a route, you can create a messenger for that route, providing
  // actions and events which that messenger should have access to.
  // (Right now this is optional, but eventually it will be required.)
  //========
  messenger?: {
    actions?: UIMessengerActions['type'][];
    events?: UIMessengerEvents['type'][];
  };
};

/**
 * Helper function that creates a React Router v6 RouteObject with layout and auth wrapping.
 * This is used with the useRoutes() hook for programmatic routing.
 *
 * @param config - Route configuration
 * @param config.path - Path for the route
 * @param config.element - The element to render for the route
 * @param config.component - Component to instantiate (alternative to element)
 * @param config.layout - The layout to use for the route
 * @param config.authenticated - Whether to wrap with the Authenticated component
 * @param config.initialized - Whether to wrap with the Initialized component
 * @param config.children - Nested route content
 * @param config.messenger - Optional messenger configuration for this route
 * @returns RouteObject ready for useRoutes()
 */
export const createRouteWithLayout = (
  config: RouteWithLayoutConfig,
): RouteObject => {
  const {
    path,
    layout: Layout,
    element,
    component: Component,
    authenticated,
    initialized,
    children,
    messenger,
  } = config;

  // Determine content: children > element > component
  let content: ReactNode =
    children || element || (Component ? <Component /> : null);

  // Wrap with RouteWithMessenger first
  if (messenger && content) {
    content = (
      <RouteWithMessenger actions={messenger.actions} events={messenger.events}>
        {content}
      </RouteWithMessenger>
    );
  }

  // Then wrap with Initialized (outermost guard)
  if (initialized && content) {
    content = <Initialized>{content}</Initialized>;
  }

  // Then wrap with Authenticated (inner guard)
  if (authenticated && content) {
    content = <Authenticated>{content}</Authenticated>;
  }

  // Finally wrap with Layout
  const wrappedElement = <Layout>{content}</Layout>;

  return {
    path,
    element: wrappedElement,
  };
};
