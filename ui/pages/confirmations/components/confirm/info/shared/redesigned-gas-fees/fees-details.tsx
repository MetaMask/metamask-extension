import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import {
  addHexes,
  getEthConversionFromWeiHex,
  getValueFromWeiHex,
  multiplyHexes,
} from '../../../../../../../../shared/modules/conversion.utils';
import { getConversionRate } from '../../../../../../../ducks/metamask/metamask';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  currentConfirmationSelector,
  getCurrentCurrency,
} from '../../../../../../../selectors';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { EditGasFeesRow } from './edit-gas-fees-row';
import { FeesRow } from './fees-row';
import { GasTimings } from './gas-timings';
import { LayerFeesRow } from './layer-fees-row';

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
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!transactionMeta?.txParams) {
    return null;
  }

  const layer1GasFee = transactionMeta?.layer1GasFee ?? null;
  const hasLayer1GasFee = layer1GasFee !== null;

  const fiatFormatter = useFiatFormatter();

  const currentCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);

  const getFeesFromHex = (hexFee: string) => {
    const nativeCurrencyFee = getEthConversionFromWeiHex({
      value: hexFee || '0x',
      fromCurrency: EtherDenomination.GWEI,
      numberOfDecimals: 4,
    });

    const currentCurrencyFee = fiatFormatter(
      Number(
        getValueFromWeiHex({
          value: hexFee || '0x',
          conversionRate,
          fromCurrency: EtherDenomination.GWEI,
          toCurrency: currentCurrency,
          numberOfDecimals: 2,
        }),
      ),
    );

    return { currentCurrencyFee, nativeCurrencyFee };
  };

  // L1
  const {
    currentCurrencyFee: currentCurrencyL1Fee,
    nativeCurrencyFee: nativeCurrencyL1Fee,
  } = getFeesFromHex(layer1GasFee || '0x');

  // L2
  const {
    currentCurrencyFee: currentCurrencyL2Fee,
    nativeCurrencyFee: nativeCurrencyL2Fee,
  } = getFeesFromHex(gasEstimate);

  // Estimated fee from breakdown = L1 + L2
  const estimatedFeeFromBreakdown = useMemo(() => {
    return addHexes(gasEstimate, (layer1GasFee as string) ?? '0x');
  }, [gasEstimate, layer1GasFee]);

  const {
    currentCurrencyFee: currentCurrencyEstimatedFeeFromBreakdown,
    nativeCurrencyFee: nativeCurrencyEstimatedFeeFromBreakdown,
  } = getFeesFromHex(estimatedFeeFromBreakdown);

  // Estimated fee without breaking down L1 and L2 fees
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  const gasLimit = transactionMeta?.txParams?.gas || '0x';
  const gasPrice = transactionMeta?.txParams?.gasPrice || '0x';

  let estimatedFee;
  if (supportsEIP1559) {
    // Minimum Total Fee = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
    const minimumFeePerGas = addHexes(
      transactionMeta?.txParams?.estimatedBaseFee || '0x0',
      maxPriorityFeePerGas,
    );

    estimatedFee = multiplyHexes(minimumFeePerGas, gasLimit);
  } else {
    estimatedFee = multiplyHexes(gasLimit, gasPrice);
  }

  const {
    currentCurrencyFee: currentCurrencyEstimatedFee,
    nativeCurrencyFee: nativeCurrencyEstimatedFee,
  } = getFeesFromHex(estimatedFee);

  // Max fee = maxFeePerGas * gasLimit
  const maxFee = useMemo(() => {
    return multiplyHexes(
      maxFeePerGas,
      (transactionMeta?.txParams?.gas as string) ?? '0x',
    );
  }, [maxFeePerGas, transactionMeta]);

  const {
    currentCurrencyFee: currentCurrencyMaxFee,
    nativeCurrencyFee: nativeCurrencyMaxFee,
  } = getFeesFromHex(maxFee);

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
            label="L1 Fee"
            tooltipText="L1 fee tooltip text"
            currentCurrencyFee={currentCurrencyL1Fee}
            nativeCurrencyFee={nativeCurrencyL1Fee}
          />
          <LayerFeesRow
            label="L2 fee"
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
          label="Max fee"
          tooltipText="Max fee tooltip text"
          currentCurrencyFees={currentCurrencyMaxFee}
          nativeCurrencyFees={nativeCurrencyMaxFee}
        />
      )}
    </>
  );
};
