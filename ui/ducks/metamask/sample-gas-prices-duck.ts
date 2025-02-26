import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  SampleGasPrices,
  SampleGasPricesControllerState,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/sample';

// Actions
export const UPDATE_GAS_PRICES = 'updateGasPrices';

export const updateGasPrices = () => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(UPDATE_GAS_PRICES);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Selectors
export const getGasPricesByChainId = createSelector(
  [
    (state: { SampleGasPricesController?: SampleGasPricesControllerState }) =>
      state.SampleGasPricesController?.gasPricesByChainId,
  ],
  (gasPricesByChainId) => gasPricesByChainId ?? {},
);

export const getGasPricesForCurrentChain = createSelector(
  [getGasPricesByChainId, getCurrentChainId],
  (gasPricesByChainId, chainId): SampleGasPrices | undefined =>
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
