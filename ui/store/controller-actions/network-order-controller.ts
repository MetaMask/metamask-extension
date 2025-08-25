import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  CaipChainId,
  Hex,
  isCaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../shared/constants/network';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors';
import { setEnabledNetworks } from '../actions';
import { MetaMaskReduxState } from '../store';

export function enableAllPopularNetworks(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch, getState) => {
    const state = getState();
    const [caipNetworkConfigMap] =
      getMultichainNetworkConfigurationsByChainId(state);

    const evmPopularNetworkChainIds = FEATURED_NETWORK_CHAIN_IDS.filter(
      (chainId) => toEvmCaipChainId(chainId) in caipNetworkConfigMap,
    );
    await dispatch(
      setEnabledNetworks(evmPopularNetworkChainIds, KnownCaipNamespace.Eip155),
    );
  };
}

export function enableSingleNetwork(
  chainId: Hex | CaipChainId,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch) => {
    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : toEvmCaipChainId(chainId);
    const { namespace, reference } = parseCaipChainId(caipChainId);

    // EVM
    if (namespace === KnownCaipNamespace.Eip155) {
      await dispatch(
        setEnabledNetworks([toHex(reference)], KnownCaipNamespace.Eip155),
      );
      return;
    }

    // Non-EVM
    await dispatch(setEnabledNetworks([caipChainId], namespace));
  };
}
