import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { alertIsOpen as unconnectedAccountAlertIsOpen } from '../../../ducks/alerts/unconnected-account';
import { alertIsOpen as invalidCustomNetworkAlertIsOpen } from '../../../ducks/alerts/invalid-custom-network';
import InvalidCustomNetworkAlert from './invalid-custom-network-alert';
import UnconnectedAccountAlert from './unconnected-account-alert';

const Alerts = ({ history }) => {
  const _invalidCustomNetworkAlertIsOpen = useSelector(
    invalidCustomNetworkAlertIsOpen,
  );
  const _unconnectedAccountAlertIsOpen = useSelector(
    unconnectedAccountAlertIsOpen,
  );

  if (_invalidCustomNetworkAlertIsOpen) {
    return <InvalidCustomNetworkAlert history={history} />;
  }
  if (_unconnectedAccountAlertIsOpen) {
    return <UnconnectedAccountAlert />;
  }

  return null;
};

Alerts.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Alerts;
