import type { LegacyGasPriceEstimate } from '@metamask/gas-fee-controller';

import { addHexPrefix } from '../../shared/lib/add-hex-prefix';
import { GasEstimateTypes as GAS_FEE_CONTROLLER_ESTIMATE_TYPES } from '../../shared/constants/gas';
import { Numeric } from '../../shared/lib/Numeric';
import { EtherDenomination } from '../../shared/constants/common';
import type { MetaMaskReduxState } from '../store/store';
import {
  getGasEstimateType,
  getGasFeeEstimates,
} from '../ducks/metamask/metamask';

export function getAveragePriceEstimateInHexWEI(
  state: MetaMaskReduxState,
): string | null {
  const averagePriceEstimate = getAverageEstimate(state);

  return averagePriceEstimate
    ? getGasPriceInHexWei(averagePriceEstimate)
    : null;
}

function getAverageEstimate(state: MetaMaskReduxState): string | null {
  const gasEstimateType = getGasEstimateType(state);

  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.legacy
    ? (getGasFeeEstimates(state) as Partial<LegacyGasPriceEstimate>)?.medium ??
        null
    : null;
}

function priceEstimateToWei(priceEstimate: string): string {
  return new Numeric(priceEstimate, 16, EtherDenomination.GWEI)
    .toDenomination(EtherDenomination.WEI)
    .round(9)
    .toString();
}

function getGasPriceInHexWei(price: string): string {
  const value = new Numeric(price, 10).toBase(16).toString();
  return addHexPrefix(priceEstimateToWei(value));
}

export function getNoGasPriceFetched(state: MetaMaskReduxState): boolean {
  const gasEstimateType = getGasEstimateType(state);
  return gasEstimateType === GAS_FEE_CONTROLLER_ESTIMATE_TYPES.none;
}
