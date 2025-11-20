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

  const value = useMemo(
    () => ({
      isQuotedSwapDisplayedInInfo,
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
