import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { QuoteResponse } from '@metamask/bridge-controller';
import { useDispatch } from 'react-redux';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { Confirmation } from '../../types/confirm';

export type ConfirmContextType = {
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  isQuotedSwapDisplayedInInfo: boolean;
  quoteSelectedForMMSwap: QuoteResponse | undefined;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  setQuoteSelectedForMMSwap: (selectedQuote: QuoteResponse | undefined) => void;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const [quoteSelectedForMMSwap, setQuoteSelectedForMMSwap] = useState<
    QuoteResponse | undefined
  >(undefined);
  const { currentConfirmation } = useCurrentConfirmation();
  useSyncConfirmPath(currentConfirmation);
  const dispatch = useDispatch();

  useEffect(() => {
    setQuoteSelectedForMMSwap(undefined);
  }, [currentConfirmation?.id, setQuoteSelectedForMMSwap]);

  const value = useMemo(
    () => ({
      currentConfirmation,
      isScrollToBottomCompleted,
      isQuotedSwapDisplayedInInfo: Boolean(quoteSelectedForMMSwap),
      quoteSelectedForMMSwap,
      setQuoteSelectedForMMSwap,
      setIsScrollToBottomCompleted,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      quoteSelectedForMMSwap,
      setIsScrollToBottomCompleted,
      setQuoteSelectedForMMSwap,
    ],
  );

  return (
    <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export const useConfirmContext = <T = Confirmation,>() => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as {
    currentConfirmation: T;
    isScrollToBottomCompleted: boolean;
    isQuotedSwapDisplayedInInfo: boolean;
    quoteSelectedForMMSwap: QuoteResponse | undefined;
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
    setQuoteSelectedForMMSwap: (
      selectedQuote: QuoteResponse | undefined,
    ) => void;
  };
};
