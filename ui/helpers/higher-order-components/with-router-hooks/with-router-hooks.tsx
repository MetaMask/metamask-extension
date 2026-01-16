import React, { useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

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

    // Stabilize params object by tracking param values
    // Extract keys and values separately to avoid JSON.stringify
    const paramKeys = hookParams
      ? Object.keys(hookParams).sort().join(',')
      : '';
    const paramValues = hookParams
      ? Object.keys(hookParams)
          .sort()
          .map((key) => hookParams[key])
          .join(',')
      : '';

    // We intentionally don't include hookParams in dependencies because
    // we want to memoize based on VALUES (paramKeys/paramValues), not object reference
    const stableParams = useMemo(
      () => props.params ?? hookParams,
      [props.params, paramKeys, paramValues],
    );

    // We intentionally don't include hookLocation in dependencies because
    // we want to memoize based on individual properties, not object reference
    const stableLocation = useMemo(
      () => props.location ?? hookLocation,
      [
        props.location,
        hookLocation.pathname,
        hookLocation.search,
        hookLocation.hash,
        hookLocation.state,
      ],
    );

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
