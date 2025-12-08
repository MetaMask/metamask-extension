import React, { ComponentType, ReactNode, useMemo } from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import Authenticated from '../helpers/higher-order-components/authenticated/authenticated.container';

type Props = {
  path: string;
  exact?: boolean;
  component?: ComponentType<RouteComponentProps>;
  children?: ReactNode;
  layout: ComponentType<{ children: ReactNode }>;
  authenticated?: boolean;
};

/*
Once migrated, we can use layouts like this:
  <Route path="/settings" element={<SettingsLayout />}>
    <Route index element={<SettingsGeneral />} />
    <Route path="advanced" element={<SettingsAdvanced />} />
  </Route>
*/

/**
 * Interim helper to wrap a component with a layout while we migrate React Router
 *
 * @param props - Route props
 * @param props.path - Path for the route
 * @param props.exact - Whether the route should match exactly
 * @param props.component - The component to render for the route (receives route props)
 * @param props.children - Alternative to component prop, renders children directly
 * @param props.layout - The layout to use for the route
 * @param props.authenticated - Whether to wrap with the Authenticated component
 * @returns Component wrapped in the layout
 */
export const RouteWithLayout = ({
  layout: Layout,
  component: Component,
  children,
  authenticated,
  ...routeProps
}: Props) => {
  // Exclude function children from deps to prevent re-memoization when render functions change reference
  // This is safe because render functions from createV5CompatRoute don't close over changing values
  const childrenDep = typeof children === 'function' ? null : children;

  const WrappedComponent = useMemo(() => {
    if (Component) {
      return (props: RouteComponentProps) => (
        <Layout>
          <Component {...props} />
        </Layout>
      );
    }
    return (props: RouteComponentProps) => (
      <Layout>
        {typeof children === 'function' ? children(props) : children}
      </Layout>
    );
  }, [Layout, Component, childrenDep]);

  if (authenticated) {
    return <Authenticated {...routeProps} component={WrappedComponent} />;
  }

  return (
    <Route
      {...routeProps}
      // @ts-expect-error RouteProps type doesn't include render prop
      render={(props: RouteComponentProps) => {
        let content;
        if (Component) {
          content = <Component {...props} />;
        } else if (typeof children === 'function') {
          content = children(props);
        } else {
          content = children;
        }

        return <Layout>{content}</Layout>;
      }}
    />
  );
};
