import React, {
  ReactElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';

import { useTransactionMetadataRequestOptional } from '../../hooks/useTransactionMetadataRequest';
import { useSignatureRequestOptional } from '../../hooks/useSignatureRequest';
import useSyncConfirmPath from '../../hooks/useSyncConfirmPath';
import { useConfirmationNavigateHome } from '../../hooks/useConfirmationNavigateHome';

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
  const [isScrollToBottomCompleted, setIsScrollToBottomCompleted] =
    useState(true);

  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;

  useSyncConfirmPath(currentConfirmation);
  useConfirmationNavigateHome(currentConfirmation);

  const value = useMemo(
    () => ({
      isScrollToBottomCompleted,
      setIsScrollToBottomCompleted,
    }),
    [isScrollToBottomCompleted, setIsScrollToBottomCompleted],
  );

  return (
    <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
  );
};

export const useConfirmContext = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error(
      'useConfirmContext must be used within an ConfirmContextProvider',
    );
  }
  return context;
};
