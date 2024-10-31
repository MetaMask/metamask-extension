import React from 'react';
import PropTypes from 'prop-types';
import useTokenListPolling from '../hooks/useTokenListPolling';

export const TokenListProvider = ({ children }) => {
  useTokenListPolling();

  return <>{children}</>;
};
TokenListProvider.propTypes = {
  children: PropTypes.node,
};
