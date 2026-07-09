import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex, add0x } from '@metamask/utils';
import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { EtherDenomination } from '../../../../../../../shared/constants/common';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
} from '../../../../../../../shared/constants/network';
import {
  addHexes,
  decGWEIToHexWEI,
  decimalToHex,
  getValueFromWeiHex,
  multiplyHexes,
} from '../../../../../../../shared/lib/conversion.utils';
import { Numeric } from '../../../../../../../shared/lib/Numeric';
import {
  getCurrentCurrency,
  getCurrencyRates,
} from '../../../../../../ducks/metamask/metamask';
import { useFiatFormatter } from '../../../../../../hooks/useFiatFormatter';
import { useGasFeeEstimates } from '../../../../../../hooks/useGasFeeEstimates';
import { selectConversionRateByChainId } from '../../../../../../selectors';
import { useTransactionGasLimit } from '../../../../hooks/gas/useTransactionGasLimit';
import { HEX_ZERO } from '../shared/constants';
import { useEIP1559TxFees } from './useEIP1559TxFees';
import { useSupportsEIP1559 } from './useSupportsEIP1559';
import { useTransactionGasFeeEstimate } from './useTransactionGasFeeEstimate';

const EMPTY_FEE = '';

const MIN_NATIVE_FEE_THRESHOLD = 0.0001;

const ETH_CONVERSION_RATE_FALLBACK_CHAIN_IDS = [
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.LINEA_SEPOLIA,
];

function getValidConversionRate(
  conversionRate: number | null | undefined,
): number | undefined {
  return Number.isFinite(conversionRate) && Number(conversionRate) > 0
    ? Number(conversionRate)
    : undefined;
}

function shouldUseEthConversionRateFallback(chainId?: Hex): boolean {
  if (!chainId) {
    return false;
  }

  return ETH_CONVERSION_RATE_FALLBACK_CHAIN_IDS.some(
    (fallbackChainId) =>
      fallbackChainId.toLowerCase() === chainId.toLowerCase(),
  );
}

function getOriginalGasLimit(
  transactionMeta: TransactionMeta,
  quotedGasLimit?: Hex,
): Hex | undefined {
  return (transactionMeta.txParamsOriginal?.gas ||
    transactionMeta.defaultGasEstimates?.gas ||
    transactionMeta.dappSuggestedGasFees?.gas ||
    quotedGasLimit ||
    transactionMeta.gasUsed ||
    transactionMeta.gasLimitNoBuffer) as Hex | undefined;
}

function getGasLimitDelta(gasLimit: Hex, originalGasLimit: string): Hex | null {
  const gasLimitDelta = new Numeric(gasLimit, 16).minus(originalGasLimit, 16);

  if (!gasLimitDelta.greaterThan(0, 10)) {
    return null;
  }

  return gasLimitDelta.toPrefixedHexString() as Hex;
}

function applySmallNativeFeeThreshold(nativeFee: string, hexFee: Hex): string {
  if (nativeFee === '0' && new Numeric(hexFee, 16).greaterThan(0, 10)) {
    return `< ${MIN_NATIVE_FEE_THRESHOLD}`;
  }
  return nativeFee;
}

export function useFeeCalculations(transactionMeta: TransactionMeta) {
  const currentCurrency = useSelector(getCurrentCurrency);
  const { chainId } = transactionMeta;
  const fiatFormatter = useFiatFormatter();

  const chainConversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );
  const currencyRates = useSelector(getCurrencyRates);
  const ethConversionRate = shouldUseEthConversionRateFallback(chainId)
    ? currencyRates?.[CURRENCY_SYMBOLS.ETH]?.conversionRate
    : undefined;
  const conversionRate =
    getValidConversionRate(chainConversionRate) ??
    getValidConversionRate(ethConversionRate);
  const hasValidConversionRate = conversionRate !== undefined;

  const { gasLimit: optimizedGasLimit } =
    useTransactionGasLimit(transactionMeta);

  const getFeesFromHex = useCallback(
    (hexFee: Hex) => {
      const nativeCurrencyFee = `${
        getValueFromWeiHex({
          value: hexFee,
          fromCurrency: EtherDenomination.GWEI,
          numberOfDecimals: 4,
        }) || 0
      }`;

      if (!hasValidConversionRate) {
        return {
          currentCurrencyFee: EMPTY_FEE,
          currentCurrencyFeeWith18SignificantDigits: null,
          hexFee,
          nativeCurrencyFee,
        };
      }

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
    [conversionRate, currentCurrency, fiatFormatter, hasValidConversionRate],
  );

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  const gasFeeEstimate = useTransactionGasFeeEstimate(
    transactionMeta,
    supportsEIP1559,
    optimizedGasLimit,
  );

  const { gasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  );
  const estimatedBaseFee = (gasFeeEstimates as GasFeeEstimates)
    ?.estimatedBaseFee;

  const layer1GasFee = transactionMeta?.layer1GasFee as Hex;
  const hasLayer1GasFee = Boolean(layer1GasFee);

  // Max fee
  const gasPrice = transactionMeta?.txParams?.gasPrice ?? HEX_ZERO;

  const getEstimatedFeeForGasLimit = useCallback(
    (gasLimit: Hex) => {
      if (!supportsEIP1559) {
        return multiplyHexes(gasPrice as Hex, gasLimit) as Hex;
      }

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

      return multiplyHexes(minimumFeePerGas as Hex, gasLimit) as Hex;
    },
    [
      estimatedBaseFee,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      supportsEIP1559,
    ],
  );

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
    hexFee: maxFeeHex,
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

    return getFeesFromHex(getEstimatedFeeForGasLimit(optimizedGasLimit));
  }, [
    gasFeeEstimate,
    getEstimatedFeeForGasLimit,
    getFeesFromHex,
    hasLayer1GasFee,
    layer1GasFee,
    optimizedGasLimit,
  ]);

  const hasEnforcedSimulations = Boolean(
    transactionMeta.containerTypes?.includes(
      TransactionContainerType.EnforcedSimulations,
    ),
  );

  const originalGasLimit = getOriginalGasLimit(transactionMeta, quotedGasLimit);

  const addedProtectionFeeFiat = useMemo(() => {
    if (!hasEnforcedSimulations || !originalGasLimit) {
      return null;
    }

    const gasLimitDelta = getGasLimitDelta(optimizedGasLimit, originalGasLimit);

    if (!gasLimitDelta) {
      return null;
    }

    const addedProtectionFee = getEstimatedFeeForGasLimit(gasLimitDelta);

    if (!new Numeric(addedProtectionFee, 16).greaterThan(0, 10)) {
      return null;
    }

    return getFeesFromHex(addedProtectionFee).currentCurrencyFee || null;
  }, [
    getEstimatedFeeForGasLimit,
    getFeesFromHex,
    hasEnforcedSimulations,
    optimizedGasLimit,
    originalGasLimit,
  ]);

  const calculateGasEstimateCallback = useCallback(
    ({
      feePerGas,
      priorityFeePerGas,
      gas,
      shouldUseEIP1559FeeLogic,
      gasPrice: gasPriceParam,
    }: {
      feePerGas: string;
      priorityFeePerGas: string;
      gas: string;
      shouldUseEIP1559FeeLogic: boolean;
      gasPrice: string;
    }) => {
      let gasEstimate: Hex;

      if (shouldUseEIP1559FeeLogic) {
        // Calculate minimum fee per gas = estimatedBaseFee + priorityFeePerGas
        // Note: feePerGas and priorityFeePerGas are hex strings from txParams/gasFeeEstimates
        let minimumFeePerGas = addHexes(
          decGWEIToHexWEI(estimatedBaseFee) || HEX_ZERO,
          feePerGas ? (priorityFeePerGas as Hex) : HEX_ZERO,
        );

        // minimumFeePerGas should never be higher than feePerGas (maxFeePerGas)
        if (
          feePerGas &&
          new Numeric(minimumFeePerGas, 16).greaterThan(feePerGas, 16)
        ) {
          minimumFeePerGas = feePerGas;
        }

        gasEstimate = multiplyHexes(minimumFeePerGas as Hex, gas as Hex);
      } else {
        gasEstimate = multiplyHexes(gasPriceParam as Hex, gas as Hex);
      }

      // Add L1 fee if present
      const totalGasEstimate = addHexes(
        gasEstimate,
        layer1GasFee ?? HEX_ZERO,
      ) as Hex;

      const fees = getFeesFromHex(totalGasEstimate);

      return {
        currentCurrencyFee: fees.currentCurrencyFee,
        preciseNativeCurrencyFee: getValueFromWeiHex({
          value: fees.hexFee,
          fromCurrency: EtherDenomination.GWEI,
          numberOfDecimals: 18,
        }),
      };
    },
    [estimatedBaseFee, layer1GasFee, getFeesFromHex],
  );

  return {
    addedProtectionFeeFiat,
    calculateGasEstimate: calculateGasEstimateCallback,
    estimatedFeeFiat: estimatedFees.currentCurrencyFee,
    estimatedFeeFiatWith18SignificantDigits:
      estimatedFees.currentCurrencyFeeWith18SignificantDigits,
    estimatedFeeNative: applySmallNativeFeeThreshold(
      estimatedFees.nativeCurrencyFee,
      estimatedFees.hexFee,
    ),
    estimatedFeeNativeHex: add0x(estimatedFees.hexFee),
    maxFeeFiat,
    maxFeeFiatWith18SignificantDigits,
    maxFeeHex: add0x(maxFeeHex),
    maxFeeNative: applySmallNativeFeeThreshold(maxFeeNative, maxFeeHex),
  };
}
