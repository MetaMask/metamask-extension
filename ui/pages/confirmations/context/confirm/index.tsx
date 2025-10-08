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
import syncConfirmPath from '../../hooks/syncConfirmPath';
import { useApprovalRequest } from '../../hooks/useApprovalRequest';
import { useUnapprovedTransaction } from '../../hooks/transactions/useUnapprovedTransaction';

export type ConfirmContextType = {
  isScrollToBottomCompleted: boolean;
  setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
};

export const ConfirmContext = createContext<ConfirmContextType | undefined>(
  undefined,
);

export const ConfirmContextProvider: React.FC<{
  children: ReactElement;
}> = ({ children }) => {
  const dispatch = useDispatch();
  const currentConfirmation = useApprovalRequest();
  const transactionMeta = useUnapprovedTransaction();

  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);

  syncConfirmPath(currentConfirmation?.id);

  const value = useMemo(
    () => ({
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    }),
    [isScrollToBottomCompleted, setIsScrollToBottomCompleted],
  );

  // The code below is added to close address details modal when opening confirmation from account details modal
  // The was account details modal is build has a complexity in routing and closing it from within account details modal
  // routes it back to home page which also closes confirmation modal.
  useEffect(() => {
    if (
      transactionMeta?.type === TransactionType.revokeDelegation ||
      transactionMeta?.type === TransactionType.batch
    ) {
      dispatch(setAccountDetailsAddress(''));
    }
  }, [dispatch, transactionMeta]);

  return (
    <ConfirmContext.Provider value={value as never}>
      {children}
    </ConfirmContext.Provider>
  );
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export const useConfirmContext = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context as {
    isScrollToBottomCompleted: boolean;
    setIsScrollToBottomCompleted: (isScrollToBottomCompleted: boolean) => void;
  };
};
