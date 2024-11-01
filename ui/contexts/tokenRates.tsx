import React, { ReactElement } from 'react';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';

export const TokenRatesProvider = ({
  children,
}: {
  children: ReactElement;
}) => {
  useTokenRatesPolling();

  return <>{children}</>;
};