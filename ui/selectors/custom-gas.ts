import { Hex } from '@metamask/utils';
import { MetaMaskReduxState } from '../store/store';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../app/scripts/lib/util';
import { decEthToConvertedCurrency } from '../../shared/modules/conversion.utils';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { formatETHFee } from '../helpers/utils/formatters';
import { getGasPrice, LegacyGasPriceEstimate } from '../ducks/send';
import { GasEstimateTypes as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import { calcGasTotal } from '../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../shared/modules/Numeric';
import { EtherDenomination } from '../../shared/constants/common';
import { getIsMainnet } from './selectors';

export function getCustomGasLimit(state: Pick<MetaMaskReduxState, 'gas'>) {
  return state.gas.customData.limit;
}

export function getCustomGasPrice(state: Pick<MetaMaskReduxState, 'gas'>) {
  return state.gas.customData.price;
}

export function getDefaultActiveButtonIndex(
  gasButtonInfo: { priceInHexWei: string | undefined }[],
  customGasPriceInHex: Hex,
  gasPrice: string,
) {
  return gasButtonInfo
    .map(({ priceInHexWei }) => priceInHexWei)
    .lastIndexOf(addHexPrefix(customGasPriceInHex || gasPrice));
}

export const getSafeLowEstimate = createDeepEqualSelector(
  getGasFeeEstimates,
  getGasEstimateType,
  (gasFeeEstimates, gasEstimateType) => {
    return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
      ? (gasFeeEstimates as LegacyGasPriceEstimate)?.low
      : null;
  },
);

export const getAverageEstimate = createDeepEqualSelector(
  getGasFeeEstimates,
  getGasEstimateType,
  (gasFeeEstimates, gasEstimateType) => {
    return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
      ? (gasFeeEstimates as LegacyGasPriceEstimate)?.medium
      : null;
  },
);

export const getAveragePriceEstimateInHexWEI = createDeepEqualSelector(
  getAverageEstimate,
  (averagePriceEstimate) => getGasPriceInHexWei(averagePriceEstimate ?? '0'),
);

export const getFastPriceEstimate = createDeepEqualSelector(
  getGasFeeEstimates,
  getGasEstimateType,
  (gasFeeEstimates, gasEstimateType) => {
    return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
      ? (gasFeeEstimates as LegacyGasPriceEstimate)?.high
      : null;
  },
);

export const getFastPriceEstimateInHexWEI = createDeepEqualSelector(
  getFastPriceEstimate,
  (fastPriceEstimate) => getGasPriceInHexWei(fastPriceEstimate || '0x0'),
);
export const isCustomPriceSafe = createDeepEqualSelector(
  getSafeLowEstimate,
  getCustomGasPrice,
  (safeLow, customGasPrice) => {
    if (!customGasPrice) {
      return true;
    }

    if (!safeLow) {
      return false;
    }

    const customPriceSafe = new Numeric(
      customGasPrice,
      16,
      EtherDenomination.WEI,
    )
      .toDenomination(EtherDenomination.GWEI)
      .greaterThan(safeLow, 10);

    return customPriceSafe;
  },
);

export const isCustomPriceSafeForCustomNetwork = createDeepEqualSelector(
  getAverageEstimate,
  getCustomGasPrice,
  (estimatedPrice, customGasPrice) => {
    if (!customGasPrice) {
      return true;
    }

    if (!estimatedPrice) {
      return false;
    }

    const customPriceSafe = new Numeric(
      customGasPrice,
      16,
      EtherDenomination.WEI,
    )
      .toDenomination(EtherDenomination.GWEI)
      .greaterThan(estimatedPrice, 10);

    return customPriceSafe;
  },
);

export const isCustomPriceExcessive = createDeepEqualSelector(
  getGasPrice,
  getCustomGasPrice,
  getFastPriceEstimate,
  (_state: Record<never, never>, checkSend: boolean = false) => checkSend,
  (gasPrice, customGasPrice, fastPrice, checkSend) => {
    const customPrice = checkSend ? gasPrice : customGasPrice;

    if (!customPrice || !fastPrice) {
      return false;
    }

    // Custom gas should be considered excessive when it is 1.5 times greater than the fastest estimate.
    const customPriceExcessive = new Numeric(
      customPrice,
      16,
      EtherDenomination.WEI,
    )
      .toDenomination(EtherDenomination.GWEI)
      .greaterThan(Math.floor(Number(fastPrice ?? 0) * 1.5), 10);

    return customPriceExcessive;
  },
);

export function basicPriceEstimateToETHTotal(
  estimate: string,
  gasLimit: string,
  numberOfDecimals = 9,
) {
  return new Numeric(
    calcGasTotal(gasLimit, estimate),
    16,
    EtherDenomination.GWEI,
  )
    .round(numberOfDecimals)
    .toBase(10)
    .toString();
}

export function getRenderableEthFee(
  estimate: string,
  gasLimit: string,
  numberOfDecimals = 9,
  nativeCurrency = 'ETH',
) {
  const value = new Numeric(estimate, 10).toBase(16).toString();
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee, nativeCurrency);
}

export function getRenderableConvertedCurrencyFee(
  estimate: string,
  gasLimit: string,
  convertedCurrency: string,
  conversionRate: number,
) {
  const value = new Numeric(estimate, 10).toBase(16).toString();
  const fee = basicPriceEstimateToETHTotal(value, gasLimit);
  const feeInCurrency = decEthToConvertedCurrency(
    fee,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(feeInCurrency, convertedCurrency);
}

export function priceEstimateToWei(priceEstimate: string) {
  return new Numeric(priceEstimate, 16, EtherDenomination.GWEI)
    .toDenomination(EtherDenomination.WEI)
    .round(9)
    .toString();
}

export function getGasPriceInHexWei(price: string) {
  const value = new Numeric(price, 10).toBase(16).toString();
  return addHexPrefix(priceEstimateToWei(value));
}

export const getIsEthGasPriceFetched = createDeepEqualSelector(
  getGasEstimateType,
  getIsMainnet,
  (gasEstimateType, isMainnet) => {
    return (
      gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ethGasPrice &&
      isMainnet
    );
  },
);

export const getIsCustomNetworkGasPriceFetched = createDeepEqualSelector(
  getGasEstimateType,
  getIsMainnet,
  (gasEstimateType, isMainnet) => {
    return (
      gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ethGasPrice &&
      !isMainnet
    );
  },
);

export const getNoGasPriceFetched = createDeepEqualSelector(
  getGasEstimateType,
  (gasEstimateType) =>
    gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none,
);

export const getIsGasEstimatesFetched = createDeepEqualSelector(
  getGasEstimateType,
  isEIP1559Network,
  (gasEstimateType, isEIP1559) => {
    if (isEIP1559) {
      return false;
    }
    return gasEstimateType !== GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none;
  },
);

export function getBasicGasEstimateLoadingStatus(
  state: Parameters<typeof getIsGasEstimatesFetched>[0],
) {
  return getIsGasEstimatesFetched(state) === false;
}
