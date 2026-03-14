/**
 * Gas-related selectors that do not depend on metamask duck or the rest of
 * selectors. Used to break the metamask → actions → selectors → confirm-transaction → metamask cycle.
 *
 * Imports only from: shared, reselect, transaction-controller.
 */

import { createSelector } from 'reselect';
import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
import { getProviderConfig } from '../../shared/lib/selectors/networks';

function getGasFeeControllerEstimateType(state) {
  return state.metamask.gasEstimateType;
}

function getGasFeeControllerEstimates(state) {
  return state.metamask.gasFeeEstimates;
}

function getTransactionGasFeeEstimates(state) {
  const transactionMetadata = state.confirmTransaction?.txData;
  return transactionMetadata?.gasFeeEstimates;
}

const getTransactionGasFeeEstimateType = createSelector(
  getTransactionGasFeeEstimates,
  (transactionGasFeeEstimates) => transactionGasFeeEstimates?.type,
);

export const getGasEstimateType = createSelector(
  getGasFeeControllerEstimateType,
  getTransactionGasFeeEstimateType,
  (gasFeeControllerEstimateType, transactionGasFeeEstimateType) => {
    return transactionGasFeeEstimateType ?? gasFeeControllerEstimateType;
  },
);

export const getGasFeeEstimates = createSelector(
  getGasFeeControllerEstimates,
  getTransactionGasFeeEstimates,
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export function getNativeCurrency(state) {
  return getProviderConfig(state).ticker;
}
