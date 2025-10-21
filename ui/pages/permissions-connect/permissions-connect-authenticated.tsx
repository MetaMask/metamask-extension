import React, { useCallback } from 'react';
import type { RouteComponentProps } from 'react-router-dom';
import AuthenticatedV5Compat from '../../helpers/higher-order-components/authenticated/authenticated-v5-compat';
import PermissionsConnect from './permissions-connect.container';

type PermissionsConnectAuthenticatedProps = RouteComponentProps<{ id: string }>;

/**
 * Wrapper component for PermissionsConnect with v5-compat authentication
 *
 * This is needed because v5 Route inside Switch requires component or render prop,
 * not children. This wrapper allows us to use the v5-compat AuthenticatedV5Compat HOC.
 *
 * It receives v5 router props (history, location, match) from the parent v5 Route,
 * and creates a navigate function compatible with v5-compat API.
 *
 * @param props - Route component props from react-router v5
 * @returns Authenticated PermissionsConnect component
 */
const PermissionsConnectAuthenticated = (
  props: PermissionsConnectAuthenticatedProps,
) => {
  const { history, location, match, ...rest } = props;

  // Create a navigate function that mimics v5-compat's useNavigate
  // but uses v5's history API under the hood
  const navigate = useCallback(
    (to: string, options: { replace?: boolean } = {}) => {
      if (options.replace) {
        history.replace(to);
      } else {
        history.push(to);
      }
    },
    [history],
  );

  return (
    <AuthenticatedV5Compat>
      <PermissionsConnect
        {...rest}
        navigate={navigate}
        location={location}
        match={match}
      />
    </AuthenticatedV5Compat>
  );
};

export default PermissionsConnectAuthenticated;
