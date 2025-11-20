import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex, add0x } from '@metamask/utils';
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
import { toHex } from '../../../../../../../shared/lib/delegation/utils';
import { getCurrentCurrency } from '../../../../../../ducks/metamask/metamask';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useGasFeeEstimates } from '../../../../../../hooks/useGasFeeEstimates';
import { selectConversionRateByChainId } from '../../../../../../selectors';
import { useDappSwapContext } from '../../../../context/dapp-swap';
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
  const { selectedQuote, isQuotedSwapDisplayedInInfo } = useDappSwapContext();

  const conversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  let quotedGasLimit;
  if (isQuotedSwapDisplayedInInfo) {
    quotedGasLimit = toHex(
      ((selectedQuote?.approval as TxData)?.gasLimit ?? 0) +
        ((selectedQuote?.trade as TxData)?.gasLimit ?? 0),
    ) as Hex;
  }

  // `gasUsed` is the gas limit actually used by the transaction in the
  // simulation environment.
  const optimizedGasLimit =
    quotedGasLimit ||
    transactionMeta?.gasUsed ||
    // While estimating gas for the transaction we add 50% gas limit buffer.
    // With `gasLimitNoBuffer` that buffer is removed. see PR
    // https://github.com/MetaMask/metamask-extension/pull/29502 for more
    // details.
    transactionMeta?.gasLimitNoBuffer ||
    transactionMeta?.txParams?.gas ||
    HEX_ZERO;

  const getFeesFromHex = useCallback(
    (hexFee: Hex) => {
      const nativeCurrencyFee = `${
        getValueFromWeiHex({
          value: hexFee,
          fromCurrency: EtherDenomination.GWEI,
          numberOfDecimals: 4,
        }) || 0
      }`;

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
        hexFee,
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
    quotedGasLimit,
  );

  const { gasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  );
  const estimatedBaseFee = (gasFeeEstimates as GasFeeEstimates)
    ?.estimatedBaseFee;

  const layer1GasFee = transactionMeta?.layer1GasFee as Hex;
  const hasLayer1GasFee = Boolean(layer1GasFee);

  // L1 fee
  const feesL1 = useMemo(
    () => (hasLayer1GasFee ? getFeesFromHex(layer1GasFee) : EMPTY_FEES),
    [getFeesFromHex, layer1GasFee, hasLayer1GasFee],
  );

  // L2 fee
  const feesL2 = useMemo(
    () => (hasLayer1GasFee ? getFeesFromHex(gasFeeEstimate) : EMPTY_FEES),
    [gasFeeEstimate, getFeesFromHex, hasLayer1GasFee],
  );

  // Max fee
  const gasPrice = transactionMeta?.txParams?.gasPrice ?? HEX_ZERO;

  const maxFee = useMemo(() => {
    return addHexes(
      layer1GasFee ?? HEX_ZERO,
      multiplyHexes(
        supportsEIP1559
          ? (decimalToHex(maxFeePerGas) as Hex)
          : (gasPrice as Hex),
        optimizedGasLimit as Hex,
      ),
    ) as Hex;
  }, [
    gasPrice,
    layer1GasFee,
    maxFeePerGas,
    optimizedGasLimit,
    supportsEIP1559,
  ]);

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
      const estimatedTotalFeesForL2 = addHexes(
        gasFeeEstimate,
        layer1GasFee,
      ) as Hex;

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

    const estimatedFee = multiplyHexes(
      supportsEIP1559 ? (minimumFeePerGas as Hex) : (gasPrice as Hex),
      optimizedGasLimit as Hex,
    );

    return getFeesFromHex(estimatedFee);
  }, [
    estimatedBaseFee,
    gasFeeEstimate,
    gasPrice,
    getFeesFromHex,
    hasLayer1GasFee,
    layer1GasFee,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559,
    transactionMeta,
  ]);

  return {
    estimatedFeeFiat: estimatedFees.currentCurrencyFee,
    estimatedFeeFiatWith18SignificantDigits:
      estimatedFees.currentCurrencyFeeWith18SignificantDigits,
    estimatedFeeNative: estimatedFees.nativeCurrencyFee,
    estimatedFeeNativeHex: add0x(estimatedFees.hexFee),
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
