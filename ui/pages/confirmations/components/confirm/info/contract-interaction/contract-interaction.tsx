import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { ConfirmInfoSection } from '../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../../helpers/constants/design-system';
import { currentConfirmationSelector } from '../../../../../../selectors';
import { SimulationDetails } from '../../../simulation-details';
import { AdvancedDetails } from '../shared/advanced-details/advanced-details';
import { RedesignedGasFees } from '../shared/redesigned-gas-fees/redesigned-gas-fees';
import { TransactionDetails } from '../shared/transaction-details/transaction-details';

type InfoProps = {
  showAdvancedDetails: boolean;
};

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
      <ConfirmInfoSection noPadding>
        <SimulationDetails
          simulationData={currentConfirmation.simulationData}
          transactionId={currentConfirmation.id}
          isTransactionsRedesign
        />
      </ConfirmInfoSection>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        <TransactionDetails />
      </Box>
      <Box
        backgroundColor={BackgroundColor.backgroundDefault}
        borderRadius={BorderRadius.MD}
        padding={2}
        marginBottom={4}
      >
        <RedesignedGasFees />
      </Box>
      {showAdvancedDetails && <AdvancedDetails />}
    </>
  );
};

export default ContractInteractionInfo;
