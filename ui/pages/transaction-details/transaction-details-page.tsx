import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Transaction } from '@metamask/keyring-api';
import type { TransactionViewModel } from '../../../shared/lib/multichain/types';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';
import { ActivityDetailsModalAdapter } from '../../components/multichain/activity-v2/activity-details-modal-adapter';
import { NonEvmDetailsModal } from '../../components/multichain/activity-v2/non-evm-details-modal';

type LocationState = {
  transaction?: TransactionViewModel;
  nonEvmTransaction?: Transaction;
};

const TransactionDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: LocationState };
  const { transaction, nonEvmTransaction } = location.state ?? {};

  const handleClose = () => {
    navigate(PREVIOUS_ROUTE);
  };

  if (nonEvmTransaction) {
    return (
      <NonEvmDetailsModal
        transaction={nonEvmTransaction}
        onClose={handleClose}
      />
    );
  }

  if (transaction) {
    return (
      <ActivityDetailsModalAdapter
        isOpen
        onClose={handleClose}
        transaction={transaction}
      />
    );
  }

  navigate(PREVIOUS_ROUTE);
  return null;
};

export default TransactionDetailsPage;
