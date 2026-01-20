import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useShallowEqualityCheck } from '../../../hooks/useShallowEqualityCheck';

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

    const stableHookParams = useShallowEqualityCheck(hookParams);
    const stableParams = props.params ?? stableHookParams;

    const stableHookLocation = useShallowEqualityCheck(hookLocation);
    const stableLocation = props.location ?? stableHookLocation;

    // Use passed props if they exist, otherwise fall back to hooks
    const navigate = props.navigate ?? hookNavigate;

    return (
      <WrappedComponent
        {...props}
        navigate={navigate}
        location={stableLocation}
        params={stableParams}
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
