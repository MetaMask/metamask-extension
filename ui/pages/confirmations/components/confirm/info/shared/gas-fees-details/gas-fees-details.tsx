import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useConfirmContext } from '../../../../../context/confirm';
import GasTiming from '../../../../gas-timing/gas-timing.component';
import { useEIP1559TxFees } from '../../hooks/useEIP1559TxFees';
import { useFeeCalculations } from '../../hooks/useFeeCalculations';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { EditGasFeesRow } from '../edit-gas-fees-row/edit-gas-fees-row';
import { GasFeesRow } from '../gas-fees-row/gas-fees-row';
import { ConfirmInfoAlertRow } from '../../../../../../../components/app/confirm/info/row/alert-row/alert-row';
import { RowAlertKey } from '../../../../../../../components/app/confirm/info/row/constants';
import { useAutomaticGasFeeTokenSelect } from '../../../../../hooks/useAutomaticGasFeeTokenSelect';
import { useEstimationFailed } from '../../../../../hooks/gas/useEstimationFailed';

export const GasFeesDetails = (): JSX.Element | null => {
  const t = useI18nContext();
  useAutomaticGasFeeTokenSelect();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  const {
    estimatedFeeFiat,
    estimatedFeeFiatWith18SignificantDigits,
    estimatedFeeNative,
    maxFeeFiat,
    maxFeeFiatWith18SignificantDigits,
    maxFeeNative,
  } = useFeeCalculations(transactionMeta);

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const estimationFailed = useEstimationFailed();

  if (!transactionMeta?.txParams) {
    return null;
  }

  const isSimpleGasFee = transactionMeta.type === TransactionType.musdClaim;

  return (
    <>
      <EditGasFeesRow
        fiatFee={estimatedFeeFiat}
        fiatFeeWith18SignificantDigits={estimatedFeeFiatWith18SignificantDigits}
        nativeFee={estimatedFeeNative}
        disableUpdate={isSimpleGasFee}
      />
      {!isSimpleGasFee &&
        supportsEIP1559 &&
        !transactionMeta.selectedGasFeeToken &&
        !transactionMeta.isGasFeeSponsored && (
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.Speed}
            data-testid="gas-fee-details-speed"
            label={t('speed')}
            ownerId={transactionMeta.id}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <GasTiming
                chainId={transactionMeta.chainId}
                maxFeePerGas={maxFeePerGas}
                maxPriorityFeePerGas={maxPriorityFeePerGas}
                userFeeLevelOverride={transactionMeta.userFeeLevel}
              />
            </Box>
          </ConfirmInfoAlertRow>
        )}
      {showAdvancedDetails &&
        !transactionMeta.selectedGasFeeToken &&
        !transactionMeta.isGasFeeSponsored &&
        !estimationFailed && (
          <GasFeesRow
            data-testid="gas-fee-details-max-fee"
            label={t('maxFee')}
            tooltipText={t('maxFeeTooltip')}
            fiatFee={maxFeeFiat}
            fiatFeeWith18SignificantDigits={maxFeeFiatWith18SignificantDigits}
            nativeFee={maxFeeNative}
          />
        )}
    </>
  );
};
