import React, {
  ReactElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { Confirmation } from '../../types/confirm';

export type ConfirmContextType = {
  currentConfirmation: Confirmation;
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
  confirmationId?: string;
}> = ({ children, confirmationId }) => {
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation } = useCurrentConfirmation(confirmationId);
  useSyncConfirmPath(currentConfirmation, confirmationId);

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
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  };
};
