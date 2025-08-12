import React, { ReactNode } from 'react';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';
import useAccountTrackerPolling from '../hooks/useAccountTrackerPolling';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';
import useTokenListPolling from '../hooks/useTokenListPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';

// This provider is a step towards making controller polling fully UI based.
// Eventually, individual UI components will call the use*Polling hooks to
// poll and return particular data. This polls globally in the meantime.
export const AssetPollingProvider = ({ children }: { children: ReactNode }) => {
  useCurrencyRatePolling();
  useTokenRatesPolling();
  useAccountTrackerPolling();
  useTokenDetectionPolling();
  useTokenListPolling();
  useDeFiPolling();

  return <>{children}</>;
};
