import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { SimulationDetails } from '../../../simulation-details';
import { TransactionDetails } from '../shared/transaction-details';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';

const ContractInteractionInfo: React.FC = () => {
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!currentConfirmation?.txParams) {
    return null;
  }

  return (
    <>
      <ConfirmInfoSection noPadding>
        <SimulationDetails
          simulationData={currentConfirmation.simulationData}
          transactionId={currentConfirmation.id}
          isTransactionsRedesign
        />
      </ConfirmInfoSection>
      <TransactionDetails />
    </>
  );
};

export default ContractInteractionInfo;
