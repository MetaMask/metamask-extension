import type { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';

import { useConfirmContext } from '../../../../context/confirm';
import { BatchSimulationDetails } from '../batch/batch-simulation-details/batch-simulation-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';

const BaseTransactionInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

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
