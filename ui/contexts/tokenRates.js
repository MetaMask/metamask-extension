import React from 'react';
import PropTypes from 'prop-types';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';

export const TokenRatesProvider = ({ children }) => {
  useTokenRatesPolling();

  return <>{children}</>;
};
TokenRatesProvider.propTypes = {
  children: PropTypes.string,
};
