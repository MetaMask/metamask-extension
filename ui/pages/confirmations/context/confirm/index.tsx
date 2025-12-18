import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { Confirmation } from '../../types/confirm';
import { usePrevious } from '../../../../hooks/usePrevious';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation } = useCurrentConfirmation(confirmationId);
  const prevCurrentConfirmation = usePrevious(currentConfirmation);
  useSyncConfirmPath(currentConfirmation);

  useEffect(() => {
    if (prevCurrentConfirmation && !currentConfirmation) {
      navigate(DEFAULT_ROUTE, { state: { stayOnHomePage: true } });
    }
  }, [currentConfirmation, prevCurrentConfirmation, navigate]);

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

export const useConfirmContext = <CurrentConfirmation = Confirmation,>() => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as {
    currentConfirmation: CurrentConfirmation;
    isScrollToBottomCompleted: boolean;
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  };
};
