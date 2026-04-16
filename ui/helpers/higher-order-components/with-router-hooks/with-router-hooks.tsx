import React, { useRef } from 'react';
import {
  useNavigate,
  useLocation,
  useParams,
  type Location as RouterLocation,
} from 'react-router-dom';
import { shallowEqual } from 'react-redux';
import { useShallowEqualityCheck } from '../../../hooks/useShallowEqualityCheck';

// Types for the router hooks
export type RouterHooksProps = {
  navigate: ReturnType<typeof useNavigate>;
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
};

/**
 * Stabilizes location by comparing only meaningful properties.
 * Intentionally excludes `key` which changes on every navigation, even to the same path.
 *
 * @param location - The location object from useLocation()
 * @returns Referentially stable location that only changes when pathname/search/hash/state change
 */
function useLocationStable(location: RouterLocation): RouterLocation {
  const ref = useRef<RouterLocation>(location);

  const isLocationParamsEqual =
    ref.current.pathname === location.pathname &&
    ref.current.search === location.search &&
    ref.current.hash === location.hash &&
    shallowEqual(ref.current.state, location.state);

  if (!isLocationParamsEqual) {
    ref.current = location;
  }

  return ref.current;
}

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

    // Stabilize location excluding 'key' which changes on every navigation
    const stableHookLocation = useLocationStable(hookLocation);
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
