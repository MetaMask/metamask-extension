import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../../helpers/constants/design-system';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { TransactionDetails } from '../shared/transaction-details';

interface InfoProps {
  showAdvancedDetails: boolean;
}

const ContractInteractionInfo: React.FC<InfoProps> = ({
  showAdvancedDetails,
}) => {
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!currentConfirmation?.txParams) {
    return null;
  }

  return (
    <>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        marginBottom={4}
      >
        <SimulationDetails
          simulationData={currentConfirmation.simulationData}
          transactionId={currentConfirmation.id}
          isTransactionsRedesign
        />
      </Box>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        <TransactionDetails />
      </Box>
      {showAdvancedDetails && (
        <Box
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.MD}
          marginBottom={4}
        >
          <AdvancedDetails />
        </Box>
      )}
    </>
  );
};

export default ContractInteractionInfo;
