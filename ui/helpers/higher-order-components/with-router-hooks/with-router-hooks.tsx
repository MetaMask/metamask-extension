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
): React.ComponentType<Props> {
  function useComponentWithRouterHooks(props: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    return (
      <WrappedComponent
        {...props}
        navigate={navigate}
        location={location}
        params={params}
      />
    );
  }

  // Preserve component name for debugging
  useComponentWithRouterHooks.displayName = `withRouterHooks(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return useComponentWithRouterHooks;
}

export default withRouterHooks;
