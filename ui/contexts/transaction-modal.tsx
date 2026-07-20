import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type TransactionModalContextType = {
  closeModal: (modalNames: string[]) => void;
  closeAllModals: () => void;
  currentModal: string | undefined;
  openModal: (modalName: string) => void;
  openModalCount: number;
};

export const TransactionModalContext = createContext<
  TransactionModalContextType | undefined
>(undefined);

export const TransactionModalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [openModals, setOpenModals] = useState<string[]>([]);

  const closeModal = (modalNames: string[]) => {
    setOpenModals((modals) =>
      modals.filter((modal) => !modalNames.includes(modal)),
    );
  };

  const closeAllModals = () => {
    setOpenModals([]);
  };

  const openModal = (modalName: string) => {
    if (openModals.includes(modalName)) {
      return;
    }
    const modals = [...openModals];
    modals.push(modalName);
    setOpenModals(modals);
  };

  return (
    <TransactionModalContext.Provider
      value={{
        closeModal,
        closeAllModals,
        currentModal: openModals[openModals.length - 1],
        openModal,
        openModalCount: openModals.length,
      }}
    >
      {children}
    </TransactionModalContext.Provider>
  );
};

export function useTransactionModalContext(): TransactionModalContextType {
  const context = useContext(TransactionModalContext);

  if (!context) {
    throw new Error(
      'useTransactionModalContext must be used within a TransactionModalContextProvider',
    );
  }

  return context;
}
