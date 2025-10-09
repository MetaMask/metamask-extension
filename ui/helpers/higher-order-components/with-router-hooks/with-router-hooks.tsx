import React from 'react';
import {
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom-v5-compat';
import { useNavState, useSetNavState } from '../../../contexts/navigation-state';

// Types for the router hooks
export type RouterHooksProps = {
  navigate: ReturnType<typeof useNavigate>;
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
  navState: ReturnType<typeof useNavState>;
  clearNavState: () => void;
};

function withRouterHooks<Props extends object>(
  WrappedComponent: React.ComponentType<Props & RouterHooksProps>,
): React.ComponentType<Props> {
  function componentWithRouterHooks(props: Props) {
    const navigate = useNavigate();
    const location = useLocation();
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
  }

  // Preserve component name for debugging
  componentWithRouterHooks.displayName = `withRouterHooks(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return componentWithRouterHooks;
}

export default withRouterHooks;
