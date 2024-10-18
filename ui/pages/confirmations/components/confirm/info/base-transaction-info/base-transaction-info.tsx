import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';

import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { useConfirmContext } from '../../../../context/confirm';
import { SimulationDetails } from '../../../simulation-details';
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
      <ConfirmInfoSection noPadding>
        <SimulationDetails
          simulationData={transactionMeta?.simulationData}
          transactionId={transactionMeta.id}
          isTransactionsRedesign
        />
      </ConfirmInfoSection>
      <TransactionDetails />
      <GasFeesSection />
      <AdvancedDetails />
    </>
  );
};

export default BaseTransactionInfo;
