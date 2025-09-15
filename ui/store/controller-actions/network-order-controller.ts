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

    // Choose the appropriate featured networks list based on the flag
    const featuredNetworkChainIds = isMultichainState2Enabled
      ? FEATURED_NETWORK_CHAIN_IDS_MULTICHAIN
      : FEATURED_NETWORK_CHAIN_IDS;

    // Fast lookup for configured chains
    const configured = new Set(Object.keys(multichainNetworkConfigMap));

    // Group chainIds by namespace in a single pass
    // Example shape: { eip155: ['0x1','0x2105'], solana: ['solana:...'] }
    const byNamespace: Partial<Record<KnownCaipNamespace, string[]>> = {};

    for (const id of featuredNetworkChainIds) {
      // EVM hex chainId (eip155)
      if (isHexString(id as Hex)) {
        const caip = toEvmCaipChainId(id as Hex); // e.g., 'eip155:1'
        if (configured.has(caip)) {
          const ns = KnownCaipNamespace.Eip155;
          (byNamespace[ns] ??= []).push(id as Hex);
        }
        continue;
      }

      // Non-EVM CAIP chainId (e.g., 'solana:...')
      if (isCaipChainId(id)) {
        if (configured.has(id)) {
          const { namespace } = parseCaipChainId(id as CaipChainId);
          (byNamespace[namespace as KnownCaipNamespace] ??= []).push(
            id as CaipChainId,
          );
        }
      }
    }

    // Nothing to enable — exit early
    if (Object.keys(byNamespace).length === 0) {
      return;
    }

    // Enable per namespace
    for (const [namespace, chainIds] of Object.entries(byNamespace)) {
      const ns = namespace as KnownCaipNamespace;

      // For multichain state, enable all namespaces including Solana
      if (isMultichainState2Enabled) {
        await dispatch(setEnabledNetworks(chainIds, ns));
      }
      // Enable EVM networks only when multichain is disabled
      if (!isMultichainState2Enabled && ns === KnownCaipNamespace.Eip155) {
        await dispatch(setEnabledNetworks(chainIds, ns));
      }
    }
  };
}

export function enableSingleNetwork(
  chainId: Hex | CaipChainId,
): ThunkAction<void, MetaMaskReduxState, unknown, AnyAction> {
  return async (dispatch, getState) => {
    const state = getState();
    const isMultichainAccountsFeatureEnabled =
      getIsMultichainAccountsState2Enabled(state);

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
