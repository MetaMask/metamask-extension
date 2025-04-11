import type { ReactNode } from 'react';
import React from 'react';

import useAccountTrackerPolling from '../hooks/useAccountTrackerPolling';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';
import useTokenListPolling from '../hooks/useTokenListPolling';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';

// This provider is a step towards making controller polling fully UI based.
// Eventually, individual UI components will call the use*Polling hooks to
// poll and return particular data. This polls globally in the meantime.
export const AssetPollingProvider = ({ children }: { children: ReactNode }) => {
  useCurrencyRatePolling();
  useTokenRatesPolling();
  useAccountTrackerPolling();
  useTokenDetectionPolling();
  useTokenListPolling();

  return <>{children}</>;
};
