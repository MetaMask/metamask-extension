import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { TRANSACTION_TYPES } from '../../shared/constants/transaction';
import { getMethodName } from '../helpers/utils/metrics';
import { useGasFeeContext } from './gasFee';
import { useMetaMetricsContext } from './metametrics';

export const TransactionModalContext = createContext({});

export const TransactionModalContextProvider = ({
  actionKey,
  children,
  methodData,
  captureEventEnabled = true,
}) => {
  const [openModals, setOpenModals] = useState([]);
  const metricsEvent = useMetaMetricsContext();
  const { transaction: { origin } = {} } = useGasFeeContext();

  const captureEvent = () => {
    metricsEvent({
      eventOpts: {
        category: 'Transactions',
        action: 'Confirm Screen',
        name: 'User clicks "Edit" on gas',
      },
      customVariables: {
        recipientKnown: null,
        functionType:
          actionKey ||
          getMethodName(methodData?.name) ||
          TRANSACTION_TYPES.CONTRACT_INTERACTION,
        origin,
      },
    });
  };

  const closeModal = (modalName) => {
    const index = openModals.indexOf(modalName);
    if (openModals < 0) return;
    const modals = [...openModals];
    modals.splice(index, 1);
    setOpenModals(modals);
  };

  const closeAllModals = () => {
    setOpenModals([]);
  };

  const openModal = (modalName) => {
    if (openModals.includes(modalName)) return;
    captureEventEnabled && captureEvent();
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
  actionKey: PropTypes.string,
  children: PropTypes.node.isRequired,
  methodData: PropTypes.object,
  captureEventEnabled: PropTypes.bool,
};
