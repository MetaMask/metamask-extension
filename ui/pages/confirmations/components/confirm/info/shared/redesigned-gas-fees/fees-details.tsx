import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { EditGasFeesRow } from './edit-gas-fees-row';
import { FeesRow } from './fees-row';
import { GasTimings } from './gas-timings';
import { LayerFeesRow } from './layer-fees-row';
import { useFeeCalculations } from './use-fees-calculations';

export const FeesDetails = ({
  gasEstimate,
  maxFeePerGas,
  maxPriorityFeePerGas,
  setShowCustomizeGasPopover,
  showAdvancedDetails,
}: {
  gasEstimate: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
  showAdvancedDetails: boolean;
}) => {
  const t = useI18nContext();

  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const layer1GasFee = transactionMeta?.layer1GasFee ?? null;
  const hasLayer1GasFee = layer1GasFee !== null;

  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  const {
    currentCurrencyEstimatedFeeFromBreakdown,
    currentCurrencyEstimatedFee,
    nativeCurrencyEstimatedFeeFromBreakdown,
    nativeCurrencyEstimatedFee,
    currentCurrencyL1Fee,
    nativeCurrencyL1Fee,
    currentCurrencyL2Fee,
    nativeCurrencyL2Fee,
    currentCurrencyMaxFee,
    nativeCurrencyMaxFee,
  } = useFeeCalculations(
    hasLayer1GasFee,
    layer1GasFee || '0x',
    gasEstimate,
    supportsEIP1559,
    transactionMeta,
    maxPriorityFeePerGas,
    maxFeePerGas,
  );

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <>
      <EditGasFeesRow
        currentCurrencyFees={
          hasLayer1GasFee
            ? currentCurrencyEstimatedFeeFromBreakdown
            : currentCurrencyEstimatedFee
        }
        nativeCurrencyFees={
          hasLayer1GasFee
            ? nativeCurrencyEstimatedFeeFromBreakdown
            : nativeCurrencyEstimatedFee
        }
        supportsEIP1559={supportsEIP1559}
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
      />
      {showAdvancedDetails && hasLayer1GasFee && (
        <>
          <LayerFeesRow
            label={t('l1Fee')}
            tooltipText="L1 fee tooltip text"
            currentCurrencyFee={currentCurrencyL1Fee}
            nativeCurrencyFee={nativeCurrencyL1Fee}
          />
          <LayerFeesRow
            label={t('l2Fee')}
            tooltipText="L2 fee tooltip text"
            currentCurrencyFee={currentCurrencyL2Fee}
            nativeCurrencyFee={nativeCurrencyL2Fee}
          />
        </>
      )}
      {supportsEIP1559 && (
        <GasTimings
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      )}
      {showAdvancedDetails && (
        <FeesRow
          label={t('maxFee')}
          tooltipText="Max fee tooltip text"
          currentCurrencyFees={currentCurrencyMaxFee}
          nativeCurrencyFees={nativeCurrencyMaxFee}
        />
      )}
    </>
  );
};
