import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useMemo, useState } from 'react';
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
import { getCurrentCurrency } from '../../../../../../../selectors';

export function useFeeCalculations(
  hasLayer1GasFee: boolean,
  layer1GasFee: string,
  gasEstimate: string,
  supportsEIP1559: boolean,
  transactionMeta: TransactionMeta,
  maxPriorityFeePerGas: string,
  maxFeePerGas: string,
) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);
  const fiatFormatter = useFiatFormatter();

  const getFeesFromHex = (hexFee: string) => {
    const nativeCurrencyFee = getEthConversionFromWeiHex({
      value: hexFee,
      fromCurrency: EtherDenomination.GWEI,
      numberOfDecimals: 4,
    });

    const currentCurrencyFee = fiatFormatter(
      Number(
        getValueFromWeiHex({
          value: hexFee,
          conversionRate,
          fromCurrency: EtherDenomination.GWEI,
          toCurrency: currentCurrency,
          numberOfDecimals: 2,
        }),
      ),
    );

    return { currentCurrencyFee, nativeCurrencyFee };
  };

  const defaultFee = '';
  const [
    currentCurrencyEstimatedFeeFromBreakdown,
    setCurrentCurrencyEstimatedFeeFromBreakdown,
  ] = useState(defaultFee);
  const [
    nativeCurrencyEstimatedFeeFromBreakdown,
    setNativeCurrencyEstimatedFeeFromBreakdown,
  ] = useState(defaultFee);
  const [currentCurrencyEstimatedFee, setCurrentCurrencyEstimatedFee] =
    useState(defaultFee);
  const [nativeCurrencyEstimatedFee, setNativeCurrencyEstimatedFee] =
    useState(defaultFee);
  const [currentCurrencyL1Fee, setCurrentCurrencyL1Fee] = useState(defaultFee);
  const [nativeCurrencyL1Fee, setNativeCurrencyL1Fee] = useState(defaultFee);
  const [currentCurrencyL2Fee, setCurrentCurrencyL2Fee] = useState(defaultFee);
  const [nativeCurrencyL2Fee, setNativeCurrencyL2Fee] = useState(defaultFee);

  useEffect(() => {
    if (hasLayer1GasFee) {
      // L1
      const feesL1 = getFeesFromHex(layer1GasFee);
      setCurrentCurrencyL1Fee(feesL1.currentCurrencyFee);
      setNativeCurrencyL1Fee(feesL1.nativeCurrencyFee || defaultFee);

      // L2
      const feesL2 = getFeesFromHex(gasEstimate);
      setCurrentCurrencyL2Fee(feesL2.currentCurrencyFee);
      setNativeCurrencyL2Fee(feesL2.nativeCurrencyFee || defaultFee);

      // Estimated fee from breakdown = L1 + L2
      const estimatedFeeFromBreakdown = addHexes(gasEstimate, layer1GasFee);
      const feesFromBreakdown = getFeesFromHex(estimatedFeeFromBreakdown);
      setCurrentCurrencyEstimatedFeeFromBreakdown(
        feesFromBreakdown.currentCurrencyFee,
      );
      setNativeCurrencyEstimatedFeeFromBreakdown(
        feesFromBreakdown.nativeCurrencyFee || defaultFee,
      );
    }
  }, [hasLayer1GasFee, layer1GasFee, gasEstimate, defaultFee]);

  useEffect(() => {
    if (!hasLayer1GasFee) {
      // Estimated fee without breaking down L1 and L2 fees
      const gasLimit =
        transactionMeta?.dappSuggestedGasFees?.gas ||
        transactionMeta?.txParams?.gas ||
        '0x';
      const gasPrice =
        transactionMeta?.dappSuggestedGasFees?.gasPrice ||
        transactionMeta?.txParams?.gasPrice ||
        '0x';

      let estimatedFee;
      if (supportsEIP1559) {
        // Minimum Total Fee (EIP1559) = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
        const minimumFeePerGas = addHexes(
          transactionMeta?.txParams?.estimatedBaseFee || '0x0',
          maxPriorityFeePerGas,
        );

        estimatedFee = multiplyHexes(minimumFeePerGas, gasLimit);
      } else {
        // Total Fee (Type 0) = gasPrice * gasLimit
        estimatedFee = multiplyHexes(gasPrice, gasLimit);
      }

      const estimatedFees = getFeesFromHex(estimatedFee);

      setCurrentCurrencyEstimatedFee(estimatedFees.currentCurrencyFee);
      setNativeCurrencyEstimatedFee(
        estimatedFees.nativeCurrencyFee || defaultFee,
      );
    }
  }, [
    hasLayer1GasFee,
    supportsEIP1559,
    transactionMeta,
    maxPriorityFeePerGas,
    defaultFee,
  ]);

  const gasLimit =
    transactionMeta?.dappSuggestedGasFees?.gas ||
    transactionMeta?.txParams?.gas ||
    '0x';
  const gasPrice = transactionMeta?.txParams?.gasPrice || '0x';

  const maxFee = useMemo(() => {
    if (supportsEIP1559) {
      // Max fee = maxFeePerGas * gasLimit
      return multiplyHexes(maxFeePerGas, gasLimit);
    }

    // Total Fee (Type 0) = gasPrice * gasLimit

    return multiplyHexes(gasPrice, gasLimit);
  }, [supportsEIP1559, maxFeePerGas, transactionMeta]);

  const {
    currentCurrencyFee: currentCurrencyMaxFee,
    nativeCurrencyFee: nativeCurrencyMaxFee,
  } = getFeesFromHex(maxFee);

  return {
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
  };
}
