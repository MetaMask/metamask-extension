import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  CaipChainId,
  Hex,
  isCaipChainId,
  isHexString,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import {
  FEATURED_NETWORK_CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN,
} from '../../../shared/constants/network';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors';
import { getIsMultichainAccountsState2Enabled } from '../../selectors/multichain-accounts/feature-flags';
import { setEnabledNetworks, setEnabledNetworksMultichain } from '../actions';
import { MetaMaskReduxState } from '../store';

export function enableAllPopularNetworks(): ThunkAction<
  void,
  MetaMaskReduxState,
  unknown,
  AnyAction
> {
  return async (dispatch, getState) => {
    const state = getState();
    const [multichainNetworkConfigMap] =
      getMultichainNetworkConfigurationsByChainId(state);
    const isMultichainState2Enabled =
      getIsMultichainAccountsState2Enabled(state);

    // Choose the appropriate featured networks constant based on feature flag
    const featuredNetworkChainIds = isMultichainState2Enabled
      ? FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN
      : FEATURED_NETWORK_CHAIN_IDS;

    // Filter to get only available EVM networks
    const availableEvmNetworks = featuredNetworkChainIds
      .filter((chainId): chainId is Hex => isHexString(chainId as Hex))
      .filter(
        (chainId) => toEvmCaipChainId(chainId) in multichainNetworkConfigMap,
      );

    // Enable all available EVM networks in a single call
    if (availableEvmNetworks.length > 0) {
      await dispatch(
        setEnabledNetworks(availableEvmNetworks, KnownCaipNamespace.Eip155),
      );
    }
  };
}

export function enableSingleNetwork(
  chainId: Hex | CaipChainId,
  isMultichainAccountsFeatureEnabled: boolean = false,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch) => {
    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : toEvmCaipChainId(chainId);
    const { namespace, reference } = parseCaipChainId(caipChainId);

    // EVM
    if (namespace === KnownCaipNamespace.Eip155) {
      if (isMultichainAccountsFeatureEnabled) {
        await dispatch(
          setEnabledNetworksMultichain(
            [toHex(reference)],
            KnownCaipNamespace.Eip155,
          ),
        );
        return;
      }
      await dispatch(
        setEnabledNetworks([toHex(reference)], KnownCaipNamespace.Eip155),
      );
      return;
    }

    // Non-EVM
    if (isMultichainAccountsFeatureEnabled) {
      await dispatch(setEnabledNetworksMultichain([caipChainId], namespace));
      return;
    }
    await dispatch(setEnabledNetworks([caipChainId], namespace));
  };
}
