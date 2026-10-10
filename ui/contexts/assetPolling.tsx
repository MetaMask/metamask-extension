import React, { ReactNode, createContext, useMemo } from 'react';
import useStaticTokensPollingHook from '../hooks/useStaticTokensPolling';
import useDeFiPolling from '../hooks/defi/useDeFiPolling';
import { useArcDefaultTokens } from '../hooks/useArcDefaultTokens';

const AssetsControllerPolling = ({ children }: { children: ReactNode }) => {
  useDeFiPolling();
  useStaticTokensPollingHook();
  useArcDefaultTokens();

  return <>{children}</>;
};

// Intentionally empty — extended in the future as polling state is exposed.
export type AssetPollingContextValue = Record<string, never>;

export const AssetPollingContext = createContext<AssetPollingContextValue>({});

// This provider is a step towards making controller polling fully UI based.
// Eventually, individual UI components will call the use*Polling hooks to
// poll and return particular data. This polls globally in the meantime.
export const AssetPollingProvider = ({ children }: { children: ReactNode }) => {
  // Memoize to keep a stable reference and prevent unnecessary re-renders in
  // any component that consumes AssetPollingContext.
  const contextValue = useMemo<AssetPollingContextValue>(() => ({}), []);

  return (
    <AssetPollingContext.Provider value={contextValue}>
      <AssetsControllerPolling>{children}</AssetsControllerPolling>
    </AssetPollingContext.Provider>
  );
};
