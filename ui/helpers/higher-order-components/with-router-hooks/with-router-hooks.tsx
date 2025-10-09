import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';
import {
  useNavState,
  useSetNavState,
} from '../../../contexts/navigation-state';

// Types for the router hooks
export type RouterHooksProps = {
  navigate: (path: string, state?: Record<string, unknown> | null) => void;
  location: ReturnType<typeof import('react-router-dom-v5-compat').useLocation>;
  params: ReturnType<typeof useParams>;
  navState: ReturnType<typeof useNavState>;
  clearNavState: () => void;
};

function withRouterHooks<Props extends object>(
  WrappedComponent: React.ComponentType<Props & RouterHooksProps>,
): React.ComponentType<Props> {
  const ComponentWithRouterHooks = (props: Props) => {
    const { navigate, location } = useSafeNavigation();
    const params = useParams();
    const navState = useNavState();
    const setNavState = useSetNavState();

    const clearNavState = () => setNavState(null);

    return (
      <WrappedComponent
        {...props}
        navigate={navigate}
        location={location}
        params={params}
        navState={navState}
        clearNavState={clearNavState}
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
