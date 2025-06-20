import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { alertIsOpen as invalidCustomNetworkAlertIsOpen } from '../../../ducks/alerts/invalid-custom-network';
import InvalidCustomNetworkAlert from './invalid-custom-network-alert';

const Alerts = ({ history }) => {
  const _invalidCustomNetworkAlertIsOpen = useSelector(
    invalidCustomNetworkAlertIsOpen,
  );

  if (_invalidCustomNetworkAlertIsOpen) {
    return <InvalidCustomNetworkAlert history={history} />;
  }

  return null;
};

Alerts.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Alerts;
