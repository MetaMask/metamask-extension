import React, { ComponentType, ReactNode, useMemo } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Route, RouteProps } from 'react-router-dom-v5-compat';
import Authenticated from '../helpers/higher-order-components/authenticated/authenticated.container';

type Props = RouteProps & {
  component: ComponentType<RouteComponentProps>;
  layout: ComponentType<{ children: ReactNode }>;
  authenticated?: boolean;
  exact?: boolean;
};

/**
 * Interim helper to wrap a component with a layout while we migrate to React Router v6 and its nested routes.
 * @param layout - The layout to use for the route
 * @param component - The component to render for the route
 * @param authenticated - Whether to wrap with the Authenticated component
 * @returns A Route component with the component wrapped in the layout
 */
export const RouteWithLayout = ({
  layout: Layout,
  component: Component,
  authenticated,
  ...routeProps
}: Props) => {
  const WrappedComponent = useMemo(
    () => (props: RouteComponentProps) => (
      <Layout>
        <Component {...props} />
      </Layout>
    ),
    [Layout, Component],
  );

  if (authenticated) {
    return <Authenticated {...routeProps} component={WrappedComponent} />;
  }

  return (
    <Route
      {...routeProps}
      // @ts-expect-error RouteProps type doesn't include render prop
      render={(props: RouteComponentProps) => (
        <Layout>
          <Component {...props} />
        </Layout>
      )}
    />
  );
};
