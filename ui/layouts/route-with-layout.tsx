import React, { ComponentType, ReactNode, useMemo } from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import Authenticated from '../helpers/higher-order-components/authenticated/authenticated.container';

type Props = {
  path: string;
  exact?: boolean;
  component: ComponentType<RouteComponentProps>;
  layout: ComponentType<{ children: ReactNode }>;
  authenticated?: boolean;
};

/**
 * Interim helper to wrap a component with a layout while we migrate to React Router v6
 * Once migrated, we can use layouts like this:
 * <Route path="/settings" element={<SettingsLayout />}>
 *   <Route index element={<SettingsGeneral />} />
 *   <Route path="advanced" element={<SettingsAdvanced />} />
 * </Route>
 *
 * @param props - Route props
 * @param props.path - Path for the route
 * @param props.component - The component to render for the route
 * @param props.exact - Whether the route should match exactly
 * @param props.layout - The layout to use for the route
 * @param props.authenticated - Whether to wrap with the Authenticated component
 * @returns Component wrapped in the layout
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
