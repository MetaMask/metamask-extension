import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { alertIsOpen as invalidCustomNetworkAlertIsOpen } from '../../../ducks/alerts/invalid-custom-network';
import InvalidCustomNetworkAlert from './invalid-custom-network-alert';

const Alerts = () => {
  const navigate = useNavigate();
  const _invalidCustomNetworkAlertIsOpen = useSelector(
    invalidCustomNetworkAlertIsOpen,
  );

  if (_invalidCustomNetworkAlertIsOpen) {
    return <InvalidCustomNetworkAlert navigate={navigate} />;
  }

  return null;
};

export default Alerts;
