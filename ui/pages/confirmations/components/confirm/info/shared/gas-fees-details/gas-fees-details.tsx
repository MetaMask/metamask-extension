/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionContainerType,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
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
import { useIsGaslessSupported } from '../../../../../hooks/gas/useIsGaslessSupported';
import { useGasSponsorshipPreference } from '../../../../../hooks/gas/useGasSponsorshipPreference';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';

export const GasFeesDetails = (): JSX.Element | null => {
  const t = useI18nContext();
  useAutomaticGasFeeTokenSelect();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  const {
    addedProtectionFeeFiat,
    addedProtectionFeeUsd,
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

  const { isSupported: isGaslessSupported } = useIsGaslessSupported();
  const { isSponsorshipOptedOut } = useGasSponsorshipPreference(
    transactionMeta?.chainId,
  );

  const isSponsorshipEligible =
    isGaslessSupported &&
    transactionMeta?.isGasFeeSponsored &&
    transactionMeta?.type !== TransactionType.revokeDelegation;

  const isGasFeeSponsored = isSponsorshipEligible && !isSponsorshipOptedOut;
  const showAddedProtectionFee = Boolean(
    transactionMeta?.containerTypes?.includes(
      TransactionContainerType.EnforcedSimulations,
    ),
  );
  const { updateTransactionEventFragment } = useTransactionEventFragment();
  const transactionId = transactionMeta?.id;
  const hasConfiguredContainers = transactionMeta?.containerTypes !== undefined;

  useEffect(() => {
    if (!transactionId || !hasConfiguredContainers) {
      return;
    }

    updateTransactionEventFragment(
      {
        properties: {
          enforced_simulation_added_network_fee_usd: showAddedProtectionFee
            ? (addedProtectionFeeUsd ?? 0)
            : 0,
        },
      },
      transactionId,
    );
  }, [
    addedProtectionFeeUsd,
    hasConfiguredContainers,
    showAddedProtectionFee,
    transactionId,
    updateTransactionEventFragment,
  ]);

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <EditGasFeesRow
        addedProtectionFeeFiat={addedProtectionFeeFiat}
        showAddedProtectionFee={showAddedProtectionFee}
        fiatFee={estimatedFeeFiat}
        fiatFeeWith18SignificantDigits={estimatedFeeFiatWith18SignificantDigits}
        nativeFee={estimatedFeeNative}
      />
      {supportsEIP1559 &&
        !transactionMeta.selectedGasFeeToken &&
        !isGasFeeSponsored && (
          <ConfirmInfoAlertRow
            alertKey={RowAlertKey.Speed}
            data-testid="gas-fee-details-speed"
            label={t('speed')}
            ownerId={transactionMeta.id}
          >
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
            >
              <GasTiming
                chainId={transactionMeta.chainId}
                networkClientId={transactionMeta.networkClientId}
                maxFeePerGas={maxFeePerGas}
                maxPriorityFeePerGas={maxPriorityFeePerGas}
                userFeeLevelOverride={transactionMeta.userFeeLevel}
              />
            </Box>
          </ConfirmInfoAlertRow>
        )}
      {showAdvancedDetails &&
        !transactionMeta.selectedGasFeeToken &&
        !isGasFeeSponsored &&
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
