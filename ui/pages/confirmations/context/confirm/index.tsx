import React, {
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { TransactionType } from '@metamask/transaction-controller';
import { useDispatch } from 'react-redux';

import { setAccountDetailsAddress } from '../../../../store/actions';
import useCurrentConfirmation from '../../hooks/useCurrentConfirmation';
import syncConfirmPath from '../../hooks/syncConfirmPath';
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
}> = ({ children }) => {
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);
  const { currentConfirmation } = useCurrentConfirmation();
  syncConfirmPath(currentConfirmation);
  const dispatch = useDispatch();

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

  // The code below is added to close address details modal when opening confirmation from account details modal
  // The was account details modal is build has a complexity in routing and closing it from within account details modal
  // routes it back to home page which also closes confirmation modal.
  useEffect(() => {
    if (
      currentConfirmation &&
      (currentConfirmation.type === TransactionType.revokeDelegation ||
        currentConfirmation.type === TransactionType.batch)
    ) {
      dispatch(setAccountDetailsAddress(''));
    }
  }, [dispatch, currentConfirmation]);

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
