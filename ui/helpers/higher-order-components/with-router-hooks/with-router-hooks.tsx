import React from 'react';
import {
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom-v5-compat';

// Types for the router hooks
export type RouterHooksProps = {
  navigate: ReturnType<typeof useNavigate>;
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
};

function withRouterHooks<Props extends object>(
  WrappedComponent: React.ComponentType<Props & RouterHooksProps>,
): React.ComponentType<Props & Partial<RouterHooksProps>> {
  const ComponentWithRouterHooks = (
    props: Props & Partial<RouterHooksProps>,
  ) => {
    const hookNavigate = useNavigate();
    const hookLocation = useLocation();
    const hookParams = useParams();

    // Use passed props if they exist, otherwise fall back to hooks
    const navigate = props.navigate ?? hookNavigate;
    const location = props.location ?? hookLocation;
    const params = props.params ?? hookParams;

    return (
      <WrappedComponent
        {...props}
        navigate={navigate}
        location={location}
        params={params}
      />
    );
  };

  // Preserve component name for debugging
  ComponentWithRouterHooks.displayName = `withRouterHooks(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithRouterHooks;
}

export default withRouterHooks;
