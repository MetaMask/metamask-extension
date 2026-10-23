import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Outlet } from 'react-router-dom';

type RampsBuildQuoteDraftContextValue = {
  /** The draft fiat amount typed on the build-quote screen. */
  draftAmount: string | undefined;
  setDraftAmount: (amount: string | undefined) => void;
};

const RampsBuildQuoteDraftContext =
  createContext<RampsBuildQuoteDraftContextValue>({
    draftAmount: undefined,
    setDraftAmount: () => undefined,
  });

/**
 * Shares the build-quote draft amount across the buy-flow screens.
 *
 * The build-quote, payment-method, and provider-selection screens are separate
 * sibling routes, so the build-quote screen unmounts when the user opens
 * payment/provider selection. Keeping the draft here ensures the amount is
 * restored when they return instead of resetting to the default and refetching
 * a different quote.
 *
 * @param props - The provider props.
 * @param props.children - The flow screens.
 */
export function RampsBuildQuoteDraftProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [draftAmount, setDraftAmount] = useState<string | undefined>(undefined);
  const value = useMemo(() => ({ draftAmount, setDraftAmount }), [draftAmount]);

  return (
    <RampsBuildQuoteDraftContext.Provider value={value}>
      {children}
    </RampsBuildQuoteDraftContext.Provider>
  );
}

/**
 * Reads the shared build-quote draft amount.
 *
 * @returns The current draft amount and its setter.
 */
export function useRampsBuildQuoteDraft() {
  return useContext(RampsBuildQuoteDraftContext);
}

/**
 * Layout route for the in-app buy flow. It stays mounted while the user moves
 * between the buy-flow screens so the build-quote draft amount survives route
 * changes.
 *
 * @returns The flow screens.
 */
export function RampsFlowLayout() {
  return (
    <RampsBuildQuoteDraftProvider>
      <Outlet />
    </RampsBuildQuoteDraftProvider>
  );
}
