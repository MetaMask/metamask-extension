import React from 'react';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';

export const TokenRatesProvider = ({ children }) => {
  useTokenRatesPolling();

  return <>{children}</>;
};
