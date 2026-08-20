import { addHexPrefix } from '../../shared/lib/add-hex-prefix';

import { GasEstimateTypes as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import {
  getGasEstimateType,
  getGasFeeEstimates,
} from '../ducks/metamask/metamask';
import { Numeric } from '../../shared/lib/Numeric';
import { EtherDenomination } from '../../shared/constants/common';

export function getAveragePriceEstimateInHexWEI(state) {
  const averagePriceEstimate = getAverageEstimate(state);

  return getGasPriceInHexWei(averagePriceEstimate);
}

function getAverageEstimate(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
    ? gasFeeEstimates?.medium
    : null;
}

function priceEstimateToWei(priceEstimate) {
  return new Numeric(priceEstimate, 16, EtherDenomination.GWEI)
    .toDenomination(EtherDenomination.WEI)
    .round(9)
    .toString();
}

function getGasPriceInHexWei(price) {
  const value = new Numeric(price, 10).toBase(16).toString();
  return addHexPrefix(priceEstimateToWei(value));
}

export function getNoGasPriceFetched(state) {
  const gasEstimateType = getGasEstimateType(state);
  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none;
}
