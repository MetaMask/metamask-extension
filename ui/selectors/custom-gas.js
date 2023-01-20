import { addHexPrefix } from '../../app/scripts/lib/util';
import {
  conversionUtil,
  conversionGreaterThan,
  decEthToConvertedCurrency,
} from '../../shared/modules/conversion.utils';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { formatETHFee } from '../helpers/utils/formatters';

import { getGasPrice } from '../ducks/send';
import { GAS_ESTIMATE_TYPES as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import { calcGasTotal } from '../../shared/lib/transactions-controller-utils';
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

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.LEGACY
    ? gasFeeEstimates?.low
    : null;
}

export function getAverageEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.LEGACY
    ? gasFeeEstimates?.medium
    : null;
}

export function getFastPriceEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);

  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.LEGACY
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

  const customPriceSafe = conversionGreaterThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: safeLow, fromNumericBase: 'dec' },
  );

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

  const customPriceSafe = conversionGreaterThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: estimatedPrice, fromNumericBase: 'dec' },
  );

  return customPriceSafe;
}

export function isCustomPriceExcessive(state, checkSend = false) {
  const customPrice = checkSend ? getGasPrice(state) : getCustomGasPrice(state);
  const fastPrice = getFastPriceEstimate(state);

  if (!customPrice || !fastPrice) {
    return false;
  }

  // Custom gas should be considered excessive when it is 1.5 times greater than the fastest estimate.
  const customPriceExcessive = conversionGreaterThan(
    {
      value: customPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    {
      fromNumericBase: 'dec',
      value: Math.floor(fastPrice * 1.5),
    },
  );

  return customPriceExcessive;
}

export function basicPriceEstimateToETHTotal(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
) {
  return conversionUtil(calcGasTotal(gasLimit, estimate), {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'GWEI',
    numberOfDecimals,
  });
}

export function getRenderableEthFee(
  estimate,
  gasLimit,
  numberOfDecimals = 9,
  nativeCurrency = 'ETH',
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit, numberOfDecimals);
  return formatETHFee(fee, nativeCurrency);
}

export function getRenderableConvertedCurrencyFee(
  estimate,
  gasLimit,
  convertedCurrency,
  conversionRate,
) {
  const value = conversionUtil(estimate, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  const fee = basicPriceEstimateToETHTotal(value, gasLimit);
  const feeInCurrency = decEthToConvertedCurrency(
    fee,
    convertedCurrency,
    conversionRate,
  );
  return formatCurrency(feeInCurrency, convertedCurrency);
}

export function priceEstimateToWei(priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  });
}

export function getGasPriceInHexWei(price) {
  const value = conversionUtil(price, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  });
  return addHexPrefix(priceEstimateToWei(value));
}

export function getIsEthGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return (
    gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ETH_GASPRICE &&
    getIsMainnet(state)
  );
}

export function getIsCustomNetworkGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return (
    gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.ETH_GASPRICE &&
    !getIsMainnet(state)
  );
}

export function getNoGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.NONE;
}

export function getIsGasEstimatesFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  if (isEIP1559Network(state)) {
    return false;
  }
  return gasEstimateType !== GAS_FEE_CONTROLLER_ESTIMATE_TYPES.NONE;
}
