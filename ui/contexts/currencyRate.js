import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { getSelectedNetworkClientId } from '../selectors';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';

export const CurrencyRateProvider = ({ children }) => {
  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  useCurrencyRatePolling(selectedNetworkClientId);

  return <>{children}</>;
};

CurrencyRateProvider.propTypes = {
  children: PropTypes.node,
};
