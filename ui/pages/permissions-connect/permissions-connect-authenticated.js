import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import AuthenticatedV5Compat from '../../helpers/higher-order-components/authenticated/authenticated-v5-compat.container';
import PermissionsConnect from './permissions-connect.container';

/**
 * Wrapper component for PermissionsConnect with v5-compat authentication
 *
 * This is needed because v5 Route inside Switch requires component or render prop,
 * not children. This wrapper allows us to use the v5-compat AuthenticatedV5Compat HOC.
 *
 * It receives v5 router props (history, location, match) from the parent v5 Route,
 * and creates a navigate function compatible with v5-compat API.
 *
 * @param props
 */
function PermissionsConnectAuthenticated(props) {
  const { history, location, match, ...rest } = props;

  // Create a navigate function that mimics v5-compat's useNavigate
  // but uses v5's history API under the hood
  const navigate = useCallback(
    (to, options = {}) => {
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
}

PermissionsConnectAuthenticated.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
};

export default PermissionsConnectAuthenticated;
