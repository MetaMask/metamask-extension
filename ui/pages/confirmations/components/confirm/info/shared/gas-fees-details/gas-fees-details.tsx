import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { ConfirmInfoRowVariant } from '../../../../../../../components/app/confirm/info/row';
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

export const GasFeesDetails = ({
  setShowCustomizeGasPopover,
}: {
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  const hasLayer1GasFee = Boolean(transactionMeta?.layer1GasFee);

  const {
    estimatedFeeFiat,
    estimatedFeeNative,
    l1FeeFiat,
    l1FeeNative,
    l2FeeFiat,
    l2FeeNative,
    maxFeeFiat,
    maxFeeNative,
  } = useFeeCalculations(transactionMeta);

  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <EditGasFeesRow
        fiatFee={estimatedFeeFiat}
        nativeFee={estimatedFeeNative}
        supportsEIP1559={supportsEIP1559}
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
      />
      {showAdvancedDetails && hasLayer1GasFee && (
        <>
          <GasFeesRow
            data-testid="gas-fee-details-l1"
            label={t('l1Fee')}
            tooltipText={t('l1FeeTooltip')}
            fiatFee={l1FeeFiat}
            nativeFee={l1FeeNative}
          />
          <GasFeesRow
            data-testid="gas-fee-details-l2"
            label={t('l2Fee')}
            tooltipText={t('l2FeeTooltip')}
            fiatFee={l2FeeFiat}
            nativeFee={l2FeeNative}
          />
        </>
      )}
      {supportsEIP1559 && (
        <ConfirmInfoAlertRow
          alertKey={RowAlertKey.Speed}
          data-testid="gas-fee-details-speed"
          label={t('speed')}
          variant={ConfirmInfoRowVariant.Default}
          ownerId={transactionMeta.id}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            <GasTiming
              maxFeePerGas={maxFeePerGas}
              maxPriorityFeePerGas={maxPriorityFeePerGas}
            />
          </Box>
        </ConfirmInfoAlertRow>
      )}
      {showAdvancedDetails && (
        <GasFeesRow
          data-testid="gas-fee-details-max-fee"
          label={t('maxFee')}
          tooltipText={t('maxFeeTooltip')}
          fiatFee={maxFeeFiat}
          nativeFee={maxFeeNative}
        />
      )}
    </>
  );
};
