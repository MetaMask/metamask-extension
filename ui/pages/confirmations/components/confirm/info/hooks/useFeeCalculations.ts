import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../shared/constants/common';
import {
  addHexes,
  decGWEIToHexWEI,
  decimalToHex,
  getValueFromWeiHex,
  multiplyHexes,
} from '../../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useGasFeeEstimates } from '../../../../../../hooks/useGasFeeEstimates';
import { getCurrentCurrency } from '../../../../../../ducks/metamask/metamask';
import { selectConversionRateByChainId } from '../../../../../../selectors';
import { getMultichainNetwork } from '../../../../../../selectors/multichain';
import { HEX_ZERO } from '../shared/constants';
import { useEIP1559TxFees } from './useEIP1559TxFees';
import { useSupportsEIP1559 } from './useSupportsEIP1559';
import { useTransactionGasFeeEstimate } from './useTransactionGasFeeEstimate';

const EMPTY_FEE = '';
const EMPTY_FEES = {
  currentCurrencyFee: EMPTY_FEE,
  currentCurrencyFeeWith18SignificantDigits: EMPTY_FEE,
  nativeCurrencyFee: EMPTY_FEE,
};

export function useFeeCalculations(transactionMeta: TransactionMeta) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const { chainId } = transactionMeta;
  const fiatFormatter = useFiatFormatter();

  const conversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  const multichainNetwork = useSelector(getMultichainNetwork);
  const ticker = multichainNetwork?.network?.ticker;

  const getFeesFromHex = useCallback(
    (hexFee: string) => {
      const nativeCurrencyFee = `${
        getValueFromWeiHex({
          value: hexFee,
          fromCurrency: EtherDenomination.GWEI,
          numberOfDecimals: 4,
        }) || 0
      } ${ticker}`;

      const decimalCurrentCurrencyFee = Number(
        getValueFromWeiHex({
          value: hexFee,
          conversionRate,
          fromCurrency: EtherDenomination.GWEI,
          toCurrency: currentCurrency,
          numberOfDecimals: 2,
        }),
      );

      let currentCurrencyFee, currentCurrencyFeeWith18SignificantDigits;
      if (decimalCurrentCurrencyFee === 0) {
        currentCurrencyFee = `< ${fiatFormatter(0.01)}`;
        currentCurrencyFeeWith18SignificantDigits = getValueFromWeiHex({
          value: hexFee,
          conversionRate,
          fromCurrency: EtherDenomination.GWEI,
          toCurrency: currentCurrency,
          numberOfDecimals: 18,
        });
      } else {
        currentCurrencyFee = fiatFormatter(decimalCurrentCurrencyFee);
        currentCurrencyFeeWith18SignificantDigits = null;
      }

      return {
        currentCurrencyFee,
        currentCurrencyFeeWith18SignificantDigits,
        nativeCurrencyFee,
      };
    },
    [conversionRate, currentCurrency, fiatFormatter],
  );

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  const gasFeeEstimate = useTransactionGasFeeEstimate(
    transactionMeta,
    supportsEIP1559,
  );

  const { gasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  );
  const estimatedBaseFee = (gasFeeEstimates as GasFeeEstimates)
    ?.estimatedBaseFee;

  const layer1GasFee = transactionMeta?.layer1GasFee as string;
  const hasLayer1GasFee = Boolean(layer1GasFee);

  // L1 fee
  const feesL1 = useMemo(
    () => (hasLayer1GasFee ? getFeesFromHex(layer1GasFee) : EMPTY_FEES),
    [layer1GasFee],
  );

  // L2 fee
  const feesL2 = useMemo(
    () => (hasLayer1GasFee ? getFeesFromHex(gasFeeEstimate) : EMPTY_FEES),
    [gasFeeEstimate],
  );

  // Max fee
  const gasLimit = transactionMeta?.txParams?.gas || HEX_ZERO;
  const gasPrice = transactionMeta?.txParams?.gasPrice || HEX_ZERO;

  const maxFee = useMemo(() => {
    return multiplyHexes(
      supportsEIP1559 ? (decimalToHex(maxFeePerGas) as Hex) : (gasPrice as Hex),
      gasLimit as Hex,
    );
  }, [supportsEIP1559, maxFeePerGas, gasLimit, gasPrice]);

  const {
    currentCurrencyFee: maxFeeFiat,
    currentCurrencyFeeWith18SignificantDigits:
      maxFeeFiatWith18SignificantDigits,
    nativeCurrencyFee: maxFeeNative,
  } = getFeesFromHex(maxFee);

  // Estimated fee
  const estimatedFees = useMemo(() => {
    if (hasLayer1GasFee) {
      // Logic for L2 transactions with L1 and L2 fee components
      const estimatedTotalFeesForL2 = addHexes(gasFeeEstimate, layer1GasFee);

      return getFeesFromHex(estimatedTotalFeesForL2);
    }

    // Logic for any network without L1 and L2 fee components
    let minimumFeePerGas = addHexes(
      decGWEIToHexWEI(estimatedBaseFee) || HEX_ZERO,
      decimalToHex(maxPriorityFeePerGas),
    );

    // `minimumFeePerGas` should never be higher than the `maxFeePerGas`
    if (
      new Numeric(minimumFeePerGas, 16).greaterThan(
        decimalToHex(maxFeePerGas),
        16,
      )
    ) {
      minimumFeePerGas = decimalToHex(maxFeePerGas);
    }

    const gasLimitNoBuffer = transactionMeta.gasLimitNoBuffer || HEX_ZERO;
    const estimatedFee = multiplyHexes(
      supportsEIP1559 ? (minimumFeePerGas as Hex) : (gasPrice as Hex),
      gasLimitNoBuffer as Hex,
    );

    return getFeesFromHex(estimatedFee);
  }, [
    gasFeeEstimate,
    transactionMeta,
    estimatedBaseFee,
    maxPriorityFeePerGas,
    getFeesFromHex,
  ]);

  return {
    estimatedFeeFiat: estimatedFees.currentCurrencyFee,
    estimatedFeeFiatWith18SignificantDigits:
      estimatedFees.currentCurrencyFeeWith18SignificantDigits,
    estimatedFeeNative: estimatedFees.nativeCurrencyFee,
    l1FeeFiat: feesL1.currentCurrencyFee,
    l1FeeFiatWith18SignificantDigits:
      feesL1.currentCurrencyFeeWith18SignificantDigits,
    l1FeeNative: feesL1.nativeCurrencyFee,
    l2FeeFiat: feesL2.currentCurrencyFee,
    l2FeeFiatWith18SignificantDigits:
      feesL2.currentCurrencyFeeWith18SignificantDigits,
    l2FeeNative: feesL2.nativeCurrencyFee,
    maxFeeFiat,
    maxFeeFiatWith18SignificantDigits,
    maxFeeNative,
  };
}
