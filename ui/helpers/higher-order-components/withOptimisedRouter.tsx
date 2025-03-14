import React, { ComponentType } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

interface WithMemoizedMatchProps {
  history: unknown;
  location: unknown;
}

/**
 * This is similar to react-router-dom's `withRouter`, but drops the `match` property
 * as it is a constantly changing prop.
 *
 * @param WrappedComponent
 * @returns WrappedComponent with routing props
 */
const withOptimisedRouter = (
  WrappedComponent: ComponentType<WithMemoizedMatchProps>,
) => {
  return () => {
    const history = useHistory();
    const location = useLocation();
    return <WrappedComponent history={history} location={location} />;
  };
};

export default withOptimisedRouter;
