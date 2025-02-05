import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId, Hex, KnownCaipNamespace } from '@metamask/utils';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../shared/constants/network';
import {
  getProviderConfig,
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
} from '../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from './accounts';
import { getMultichainNetworkProviders } from './multichain-core';
import { getMultichainIsEvm } from './multichain-isevm';
import type {
  MultichainState,
  ProviderConfigWithImageUrlAndExplorerUrl,
  MultichainNetwork,
} from './multichain.types';
import { getMultichainProviderConfig } from './multichain-provider-config';

export function getMultichainNetwork(
  state: MultichainState,
  account?: InternalAccount,
): MultichainNetwork {
  const isEvm = getMultichainIsEvm(state, account);

  if (isEvm) {
    // EVM networks
    const evmChainId: Hex = getCurrentChainId(state);

    // TODO: Update to use network configurations when @metamask/network-controller is updated to 20.0.0
    // ProviderConfig will be deprecated to use NetworkConfigurations
    // When a user updates a network name its only updated in the NetworkConfigurations.
    const evmNetwork: ProviderConfigWithImageUrlAndExplorerUrl =
      getProviderConfig(state) as ProviderConfigWithImageUrlAndExplorerUrl;

    const evmChainIdKey =
      evmChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

    evmNetwork.rpcPrefs = {
      ...evmNetwork.rpcPrefs,
      imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey],
    };

    const networkConfigurations = getNetworkConfigurationsByChainId(state);
    return {
      nickname: networkConfigurations[evmChainId]?.name ?? evmNetwork.rpcUrl,
      isEvmNetwork: true,
      // We assume the chain ID is `string` or `number`, so we convert it to a
      // `Number` to be compliant with EIP155 CAIP chain ID
      chainId: `${KnownCaipNamespace.Eip155}:${Number(
        evmChainId,
      )}` as CaipChainId,
      network: evmNetwork,
    };
  }

  // Non-EVM networks:
  // (Hardcoded for testing)
  // HACK: For now, we rely on the account type being "sort-of" CAIP compliant, so use
  // this as a CAIP-2 namespace and apply our filter with it
  // For non-EVM, we know we have a selected account, since the logic `isEvm` is based
  // on having a non-EVM account being selected!
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const nonEvmNetworks = getMultichainNetworkProviders(state);
  const nonEvmNetwork = nonEvmNetworks.find((provider) => {
    return provider.isAddressCompatible(selectedAccount.address);
  });

  if (!nonEvmNetwork) {
    throw new Error(
      'Could not find non-EVM provider for the current configuration. This should never happen.',
    );
  }

  return {
    // TODO: Adapt this for other non-EVM networks
    nickname: nonEvmNetwork.nickname,
    isEvmNetwork: false,
    chainId: nonEvmNetwork?.chainId,
    network: nonEvmNetwork,
  };
}
export function getMultichainCurrentNetwork(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainProviderConfig(state, account);
}
