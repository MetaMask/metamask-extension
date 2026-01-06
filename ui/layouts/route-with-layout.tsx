import React, { ComponentType, ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import Authenticated from '../helpers/higher-order-components/authenticated/authenticated.container';
import Initialized from '../helpers/higher-order-components/initialized';
import type { RootLayout } from './root-layout';
import type { LegacyLayout } from './legacy-layout';

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
  } = config;

  // Determine content: children > element > component
  let content: ReactNode =
    children || element || (Component ? <Component /> : null);

  // Wrap with Initialized first (outermost guard)
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
