import { addHexPrefix } from '../../app/scripts/lib/util';
import { decEthToConvertedCurrency } from '../../shared/modules/conversion.utils';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { formatETHFee } from '../helpers/utils/formatters';

import { getGasPrice } from '../ducks/send';
import { GasEstimateTypes as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import { calcGasTotal } from '../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../shared/modules/Numeric';
import { EtherDenomination } from '../../shared/constants/common';
import { getIsMainnet } from '.';

export function getCustomGasLimit(state) {
  return state.gas.customData.limit;
}

export function getCustomGasPrice(state) {
  return state.gas.customData.price;
}

export function getBasicGasEstimateLoadingStatus(state) {
  return getIsGasEstimatesFetched(state) === false;
}

export function getAveragePriceEstimateInHexWEI(state) {
  const averagePriceEstimate = getAverageEstimate(state);

  return getGasPriceInHexWei(averagePriceEstimate);
}

export function getFastPriceEstimateInHexWEI(state) {
  const fastPriceEstimate = getFastPriceEstimate(state);
  return getGasPriceInHexWei(fastPriceEstimate || '0x0');
}

export function getDefaultActiveButtonIndex(
  gasButtonInfo,
  customGasPriceInHex,
  gasPrice,
) {
  return gasButtonInfo
    .map(({ priceInHexWei }) => priceInHexWei)
    .lastIndexOf(addHexPrefix(customGasPriceInHex || gasPrice));
}

export function getSafeLowEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
    ? gasFeeEstimates?.low
    : null;
}

export function getAverageEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
    ? gasFeeEstimates?.medium
    : null;
}

export function getFastPriceEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);

  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
    ? gasFeeEstimates?.high
    : null;
}

export function isCustomPriceSafe(state) {
  const safeLow = getSafeLowEstimate(state);

  const customGasPrice = getCustomGasPrice(state);

  if (!customGasPrice) {
    return true;
  }

  if (!safeLow) {
    return false;
  }

  const customPriceSafe = new Numeric(customGasPrice, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.GWEI)
    .greaterThan(safeLow, 10);

  return customPriceSafe;
}

export function isCustomPriceSafeForCustomNetwork(state) {
  const estimatedPrice = getAverageEstimate(state);

  const customGasPrice = getCustomGasPrice(state);

  if (!customGasPrice) {
    return true;
  }

  if (!estimatedPrice) {
    return false;
  }

  const customPriceSafe = new Numeric(customGasPrice, 16, EtherDenomination.WEI)
    .toDenomination(EtherDenomination.GWEI)
    .greaterThan(estimatedPrice, 10);

  return customPriceSafe;
}

export function isCustomPriceExcessive(state, checkSend = false) {
  const customPrice = checkSend ? getGasPrice(state) : getCustomGasPrice(state);
  const fastPrice = getFastPriceEstimate(state);

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
    .greaterThan(Math.floor(fastPrice * 1.5), 10);

  return customPriceExcessive;
}

export function basicPriceEstimateToETHTotal(
  estimate,
  gasLimit,
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
  estimate,
  gasLimit,
  numberOfDecimals = 9,
  nativeCurrency = 'ETH',
) {
  const value = new Numeric(estimate, 10).toBase(16).toString();
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee, nativeCurrency);
}

export function getRenderableConvertedCurrencyFee(
  estimate,
  gasLimit,
  convertedCurrency,
  conversionRate,
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

export function priceEstimateToWei(priceEstimate) {
  return new Numeric(priceEstimate, 16, EtherDenomination.GWEI)
    .toDenomination(EtherDenomination.WEI)
    .round(9)
    .toString();
}

export function getGasPriceInHexWei(price) {
  const value = new Numeric(price, 10).toBase(16).toString();
  return addHexPrefix(priceEstimateToWei(value));
}

export function getIsEthGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return (
    gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ethGasPrice &&
    getIsMainnet(state)
  );
}

export function getIsCustomNetworkGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return (
    gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ethGasPrice &&
    !getIsMainnet(state)
  );
}

export function getNoGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none;
}

export function getIsGasEstimatesFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  if (isEIP1559Network(state)) {
    return false;
  }
  return gasEstimateType !== GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none;
}
