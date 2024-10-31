import React from 'react';
import PropTypes from 'prop-types';
import useTokenListPolling from '../hooks/useTokenListPolling';

export const TokenRatesProvider = ({ children }) => {
  useTokenListPolling();

  return <>{children}</>;
};
TokenRatesProvider.propTypes = {
  children: PropTypes.node,
};
