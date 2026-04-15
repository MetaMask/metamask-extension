import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import useCurrencyRatePolling from '../hooks/useCurrencyRatePolling';
import useTokenRatesPolling from '../hooks/useTokenRatesPolling';
import useTokenDetectionPolling from '../hooks/useTokenDetectionPolling';
import useTokenListPolling from '../hooks/useTokenListPolling';
import useStaticTokensPollingHook from '../hooks/useStaticTokensPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';
import useMultichainAssetsRatesPolling from '../hooks/useMultichainAssetsRatesPolling';
import { getIsAssetsUnifyStateEnabled } from '../selectors/assets-unify-state';

// Calls all legacy polling hooks unconditionally. Rendered only when
// assets-unify-state is disabled so that the hooks always execute in the
// same order within this component (satisfying React's Rules of Hooks).
const LegacyAssetsPolling = ({ children }: { children: ReactNode }) => {
  useCurrencyRatePolling();
  useTokenRatesPolling();
  useTokenDetectionPolling();
  useTokenListPolling();
  useDeFiPolling();
  useMultichainAssetsRatesPolling();
  useStaticTokensPollingHook();

  return <>{children}</>;
};

const AssetsControllerPolling = ({ children }: { children: ReactNode }) => {
  useTokenListPolling();
  useDeFiPolling();
  useStaticTokensPollingHook();

  return <>{children}</>;
};

// This provider is a step towards making controller polling fully UI based.
// Eventually, individual UI components will call the use*Polling hooks to
// poll and return particular data. This polls globally in the meantime.
export const AssetPollingProvider = ({ children }: { children: ReactNode }) => {
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);

  if (isAssetsUnifyStateEnabled) {
    return <AssetsControllerPolling>{children}</AssetsControllerPolling>;
  }

  return <LegacyAssetsPolling>{children}</LegacyAssetsPolling>;
};
