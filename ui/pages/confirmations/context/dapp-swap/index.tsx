import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { QuoteResponseV1 } from '@metamask/bridge-controller';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';

export type DappSwapContextType = {
  isQuotedSwapDisplayedInInfo: boolean;
  isQuotedSwapPresent: boolean;
  selectedQuote: QuoteResponseV1 | undefined;
  setSelectedQuote: (selectedQuote: QuoteResponseV1 | undefined) => void;
  setQuotedSwapDisplayedInInfo: (isQuotedSwapDisplayedInInfo: boolean) => void;
};

export const DappSwapContext = createContext<DappSwapContextType | undefined>(
  undefined,
);

type DappSwapState = {
  confirmationId: string | undefined;
  selectedQuote: QuoteResponseV1 | undefined;
  isQuotedSwapDisplayedInInfo: boolean;
};

export const DappSwapContextProvider = ({
  children,
}: React.PropsWithChildren<{
  children: ReactElement;
}>) => {
  const { currentConfirmation } = useCurrentConfirmation();
  const confirmationId = currentConfirmation?.id;
  // Keyed by confirmationId so a confirmation change drops quote/display state
  // without render-phase setters.
  const [swapState, setSwapState] = useState<DappSwapState>({
    confirmationId,
    selectedQuote: undefined,
    isQuotedSwapDisplayedInInfo: false,
  });

  const selectedQuote =
    swapState.confirmationId === confirmationId
      ? swapState.selectedQuote
      : undefined;

  const isQuotedSwapDisplayedInInfoState =
    swapState.confirmationId === confirmationId
      ? swapState.isQuotedSwapDisplayedInInfo
      : false;

  const setSelectedQuote = useCallback(
    (quote: QuoteResponseV1 | undefined) => {
      setSwapState((prev) => {
        // Clear the display flag when the quote is removed so a later quote
        // does not auto-show without an explicit user toggle.
        let isQuotedSwapDisplayedInInfo = false;
        if (quote !== undefined && prev.confirmationId === confirmationId) {
          isQuotedSwapDisplayedInInfo = prev.isQuotedSwapDisplayedInInfo;
        }
        return {
          confirmationId,
          selectedQuote: quote,
          isQuotedSwapDisplayedInInfo,
        };
      });
    },
    [confirmationId],
  );

  const setQuotedSwapDisplayedInInfo = useCallback(
    (displayed: boolean) => {
      setSwapState((prev) => ({
        confirmationId,
        selectedQuote:
          prev.confirmationId === confirmationId
            ? prev.selectedQuote
            : undefined,
        isQuotedSwapDisplayedInInfo: displayed,
      }));
    },
    [confirmationId],
  );

  const isQuotedSwapDisplayedInInfo = Boolean(
    selectedQuote && isQuotedSwapDisplayedInInfoState,
  );

  const value = useMemo(
    () => ({
      isQuotedSwapDisplayedInInfo,
      isQuotedSwapPresent: selectedQuote !== undefined,
      selectedQuote,
      setSelectedQuote,
      setQuotedSwapDisplayedInInfo,
    }),
    [
      isQuotedSwapDisplayedInInfo,
      selectedQuote,
      setSelectedQuote,
      setQuotedSwapDisplayedInInfo,
    ],
  );

  return (
    <DappSwapContext.Provider value={value}>
      {children}
    </DappSwapContext.Provider>
  );
};

export const useDappSwapContext = () => {
  const context = useContext(DappSwapContext);
  if (!context) {
    throw new Error(
      'useDappSwapContext must be used within an DappSwapContextProvider',
    );
  }
  return context as DappSwapContextType;
};

/**
 * Optional version of useDappSwapContext. Returns undefined when used outside
 * DappSwapContextProvider. Use when a component can be rendered in both confirm
 * flow and outside it (e.g. cancel-speedup gas fee display).
 */
export const useDappSwapContextOptional = (): DappSwapContextType | undefined =>
  useContext(DappSwapContext) as DappSwapContextType | undefined;
