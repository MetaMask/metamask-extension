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
import { TransactionDetails } from '../shared/transaction-details';
import { ConfirmInfoRowText } from '../../../../../../components/app/confirm/info/row';
import { AlertRow } from '../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../components/app/confirm/info/row/constants';

const ContractInteractionInfo: React.FC = () => {
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
        {
          // Temporary row for design review only
        }
        <AlertRow
          label="Estimated fee"
          tooltip="Estimated fee"
          alertKey={RowAlertKey.EstimatedFee}
          ownerId={currentConfirmation.id}
        >
          <ConfirmInfoRowText
            text={currentConfirmation?.txParams?.maxFeePerGas ?? '-'}
          />
        </AlertRow>
      </Box>
    </>
  );
};

export default ContractInteractionInfo;
