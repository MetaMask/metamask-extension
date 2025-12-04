import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import { alertIsOpen as invalidCustomNetworkAlertIsOpen } from '../../../ducks/alerts/invalid-custom-network';
import InvalidCustomNetworkAlert from './invalid-custom-network-alert';

const Alerts = ({ navigate }) => {
  const _invalidCustomNetworkAlertIsOpen = useSelector(
    invalidCustomNetworkAlertIsOpen,
  );

  if (_invalidCustomNetworkAlertIsOpen) {
    return <InvalidCustomNetworkAlert navigate={navigate} />;
  }

  return null;
};

Alerts.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default Alerts;
