// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { addHexPrefix } from '../../app/scripts/lib/util';

import { GasEstimateTypes as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  isEIP1559Network,
} from '../ducks/metamask/metamask';
import { calcGasTotal } from '../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../shared/modules/Numeric';
import { EtherDenomination } from '../../shared/constants/common';

export function getCustomGasPrice(state) {
  return state.gas.customData.price;
}

export function getAveragePriceEstimateInHexWEI(state) {
  const averagePriceEstimate = getAverageEstimate(state);

  return getGasPriceInHexWei(averagePriceEstimate);
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
