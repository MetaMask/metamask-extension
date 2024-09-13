import React, {
  ReactElement,
  createContext,
  useContext,
  useState,
} from 'react';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import syncConfirmPath from '../../hooks/syncConfirmPath';
import { Confirmation } from '../../types/confirm';

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

  return (
    <ConfirmContext.Provider
      value={{
        currentConfirmation,
        isScrollToBottomCompleted,
        setIsScrollToBottomCompleted,
      }}
    >
      {children}
    </ConfirmContext.Provider>
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
