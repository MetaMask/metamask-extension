import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

export const TransactionModalContext = createContext({});

export const TransactionModalContextProvider = ({ children }) => {
  const [openModals, setOpenModals] = useState([]);

  const closeModal = (modalNames) => {
    if (openModals < 0) {
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

  const openModal = (modalName) => {
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

export function useTransactionModalContext() {
  return useContext(TransactionModalContext);
}

TransactionModalContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
