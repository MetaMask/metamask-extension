import React from 'react';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';
import { useUnapprovedTransaction } from '../../../../hooks/transactions/useUnapprovedTransaction';

const BaseTransactionInfo = () => {
  const transactionMeta = useUnapprovedTransaction();

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <TransactionAccountDetails />
      <BatchSimulationDetails />
      <TransactionDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default BaseTransactionInfo;
