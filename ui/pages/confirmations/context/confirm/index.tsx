import type {
  ReactElement} from 'react';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

import syncConfirmPath from '../../hooks/syncConfirmPath';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import type { Confirmation } from '../../types/confirm';

type ConfirmContextType = {
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation } = useCurrentConfirmation();
  syncConfirmPath(currentConfirmation);

  const value = useMemo(
    () => ({
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    }),
    [
      currentConfirmation,
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    ],
  );

  return (
    <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
  );
};

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
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  };
};
