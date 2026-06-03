import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QuoteResponse } from '@metamask/bridge-controller';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';

export type DappSwapContextType = {
  isQuotedSwapDisplayedInInfo: boolean;
  isQuotedSwapPresent: boolean;
  selectedQuote: QuoteResponse | undefined;
  setSelectedQuote: (selectedQuote: QuoteResponse | undefined) => void;
  setQuotedSwapDisplayedInInfo: (isQuotedSwapDisplayedInInfo: boolean) => void;
};

export const DappSwapContext = createContext<DappSwapContextType | undefined>(
  undefined,
);

export const DappSwapContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const { currentConfirmation } = useCurrentConfirmation();
  const [selectedQuote, setSelectedQuote] = useState<QuoteResponse | undefined>(
    undefined,
  );
  const [isQuotedSwapDisplayedInInfo, setQuotedSwapDisplayedInInfo] =
    useState(false);

  useEffect(() => {
    setSelectedQuote(undefined);
    setQuotedSwapDisplayedInInfo(false);
  }, [currentConfirmation?.id, setSelectedQuote, setQuotedSwapDisplayedInInfo]);

  useEffect(() => {
    if (!selectedQuote) {
      setQuotedSwapDisplayedInInfo(false);
    }
  }, [selectedQuote, setQuotedSwapDisplayedInInfo]);

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
