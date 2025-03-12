import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { GasFeesSection } from '../shared/gas-fees-section/gas-fees-section';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';
import { TransactionAccountDetails } from '../batch/transaction-account-details';

const BaseTransactionInfo = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <TransactionAccountDetails />
      <SimulationDetails
        transaction={transactionMeta}
        isTransactionsRedesign
        enableMetrics
      />
      <TransactionDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default BaseTransactionInfo;
