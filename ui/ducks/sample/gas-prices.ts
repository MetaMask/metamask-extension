import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';

// Types
export type GasPrices = {
  low: string;
  average: string;
  high: string;
  fetchedDate: number;
};

export type GasPricesState = {
  gasPricesByChainId: Record<Hex, GasPrices>;
};

// Actions
export const UPDATE_GAS_PRICES = 'GasPricesController:updateGasPrices';

export const updateGasPrices = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(UPDATE_GAS_PRICES);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Selectors
export const getGasPricesByChainId = createSelector(
  [
    (state: { GasPricesController?: GasPricesState }) =>
      state.GasPricesController?.gasPricesByChainId,
  ],
  (gasPricesByChainId) => gasPricesByChainId ?? {},
);

export const getGasPricesForCurrentChain = createSelector(
  [getGasPricesByChainId, getCurrentChainId],
  (gasPricesByChainId, chainId): GasPrices | undefined =>
    gasPricesByChainId[chainId],
);

// Hook
export function useGasPrices() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const gasPrices = useSelector(getGasPricesForCurrentChain);

  return {
    ...gasPrices,
    updateGasPrices: () => dispatch(updateGasPrices()),
  };
}
