import React from 'react';
import PropTypes from 'prop-types';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';

export const TokenDetectionProvider = ({ children }) => {
  useTokenDetectionPolling();

  return <>{children}</>;
};

TokenDetectionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
