import React from 'react';
import PropTypes from 'prop-types';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';

export const CurrencyRateProvider = ({ children }) => {
  useCurrencyRatePolling();

  return <>{children}</>;
};

CurrencyRateProvider.propTypes = {
  children: PropTypes.node,
};
