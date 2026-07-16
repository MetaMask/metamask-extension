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

export const TransactionModalContext =
  createContext<TransactionModalContextType>(
    {} as TransactionModalContextType,
  );

export const TransactionModalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [openModals, setOpenModals] = useState<string[]>([]);

  const closeModal = (modalNames: string[]) => {
    if ((openModals as unknown as number) < 0) {
      return;
    }
    const modals = [...openModals];
    modalNames.forEach((modal) => {
      const index = openModals.indexOf(modal);
      modals.splice(index, 1);
    });
    setOpenModals(modals);
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
  return useContext(TransactionModalContext);
}
