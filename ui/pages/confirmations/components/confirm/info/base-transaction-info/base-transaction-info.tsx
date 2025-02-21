import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useConfirmContext } from '../../../../context/confirm';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';

const BaseTransactionInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <BatchSimulationDetails />
      <TransactionDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default BaseTransactionInfo;
