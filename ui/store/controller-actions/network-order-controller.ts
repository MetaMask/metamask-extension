import { ThunkAction } from 'redux-thunk';
import { MetaMaskReduxState } from '../store';
import { AnyAction } from 'redux';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../shared/constants/network';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { setEnabledNetworks } from '../actions';
import {
  CaipChainId,
  Hex,
  isCaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

export function enableAllPopularNetworks(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return (dispatch, getState) => {
    const state = getState();
    const [caipNetworkConfigMap] =
      getMultichainNetworkConfigurationsByChainId(state);

    const evmPopularNetworkChainIds = FEATURED_NETWORK_CHAIN_IDS.filter(
      (chainId) => toEvmCaipChainId(chainId) in caipNetworkConfigMap,
    );
    dispatch(
      setEnabledNetworks(evmPopularNetworkChainIds, KnownCaipNamespace.Eip155),
    );
  };
}

export function enableSingleNetwork(
  chainId: Hex | CaipChainId,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return (dispatch) => {
    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : toEvmCaipChainId(chainId);
    const { namespace, reference } = parseCaipChainId(caipChainId);

    // EVM
    if (namespace === KnownCaipNamespace.Eip155) {
      dispatch(setEnabledNetworks([chainId], KnownCaipNamespace.Eip155));
      return;
    }

    // Non-EVM
    dispatch(setEnabledNetworks([caipChainId], namespace));
    return;
  };
}
