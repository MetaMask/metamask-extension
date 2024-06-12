import { isEvmAccountType } from '@metamask/keyring-api';
import { ProviderConfig } from '@metamask/network-controller';
import {
  CaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import {
  MultichainProviderConfig,
  MULTICHAIN_PROVIDER_CONFIGS,
} from '../../shared/constants/multichain/networks';
import {
  getCompletedOnboarding,
  getNativeCurrency,
  getProviderConfig,
} from '../ducks/metamask/metamask';
import { AccountsState } from './accounts';
import {
  getAllNetworks,
  getCurrentCurrency,
  getNativeCurrencyImage,
  getSelectedInternalAccount,
  getShouldShowFiat,
} from '.';

export type MultichainState = AccountsState & {
  metamask: {
    // TODO: Use states from new {Rates,Balances,Chain}Controller
  };
};

export type MultichainNetwork = {
  nickname: string;
  isEvmNetwork: boolean;
  chainId?: CaipChainId;
  network?: ProviderConfig | MultichainProviderConfig;
};

export function getMultichainNetworkProviders(
  _state: MultichainState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}

export function getMultichainNetwork(
  state: MultichainState,
): MultichainNetwork {
  const isOnboarded = getCompletedOnboarding(state);
  // Selected account is not available during onboarding
  // This is used in the app header
  const selectedAccount = getSelectedInternalAccount(state);
  const isEvm = isEvmAccountType(selectedAccount?.type);

  // EVM networks
  const evmNetworks: ProviderConfig[] = getAllNetworks(state);
  const evmProvider: ProviderConfig = getProviderConfig(state);

  if (!isOnboarded || isEvm) {
    const evmChainId =
      `${KnownCaipNamespace.Eip155}:${evmProvider.chainId}` as CaipChainId;
    const evmNetwork = evmNetworks.find(
      (network) => network.chainId === evmProvider.chainId,
    );

    return {
      nickname: 'Ethereum',
      isEvmNetwork: true,
      chainId: evmChainId,
      network: evmNetwork,
    };
  }

  // Non-EVM networks
  // (Hardcoded for testing)
  // HACK: For now, we rely on the account type being "sort-of" CAIP compliant, so use
  // this as a CAIP-2 namespace and apply our filter with it
  const nonEvmNetworks = getMultichainNetworkProviders(state);
  const nonEvmNetwork = nonEvmNetworks.find((provider) => {
    const { namespace } = parseCaipChainId(provider.chainId);
    return selectedAccount.type.startsWith(namespace);
  });

  return {
    // TODO: Adapt this for other non-EVM networks
    // TODO: We need to have a way of setting nicknames of other non-EVM networks
    nickname: 'Bitcoin',
    isEvmNetwork: false,
    // FIXME: We should use CAIP-2 chain ID here, and not only the reference part
    chainId: nonEvmNetwork?.chainId,
    network: nonEvmNetwork,
  };
}

// FIXME: All the following might have side-effect, like if the current account is a bitcoin one and that
// a popup (for ethereum related stuffs) is being shown (and uses this function), then the native
// currency will be BTC..

export function getMultichainIsEvm(state: MultichainState) {
  const selectedAccount = getSelectedInternalAccount(state);

  // There are no selected account during onboarding. we default to the current EVM provider.
  return !selectedAccount || isEvmAccountType(selectedAccount.type);
}

export function getMultichainProviderConfig(
  state: MultichainState,
): ProviderConfig | MultichainProviderConfig {
  return getMultichainIsEvm(state)
    ? getProviderConfig(state)
    : getMultichainNetwork(state).network;
}

export function getMultichainCurrentNetwork(state: MultichainState) {
  return getMultichainProviderConfig(state);
}

export function getMultichainNativeCurrency(state: MultichainState) {
  return getMultichainIsEvm(state)
    ? getNativeCurrency(state)
    : getMultichainProviderConfig(state).ticker;
}

export function getMultichainCurrentCurrency(state: MultichainState) {
  const currentCurrency = getCurrentCurrency(state).toLowerCase();

  // To mimic `getCurrentCurrency` we only consider fiat values, otherwise we
  // fallback to the current ticker symbol value
  return currentCurrency === 'usd'
    ? 'usd'
    : getMultichainProviderConfig(state).ticker;
}

export function getMultichainCurrencyImage(state: MultichainState) {
  if (getMultichainIsEvm(state)) {
    return getNativeCurrencyImage(state);
  }

  const provider = getMultichainProviderConfig(
    state,
  ) as MultichainProviderConfig;
  return provider.rpcPrefs?.imageUrl;
}

export function getMultichainShouldShowFiat(state: MultichainState) {
  return getMultichainIsEvm(state)
    ? getShouldShowFiat(state)
    : // For now we force this for non-EVM
      true;
}

export function getMultichainDefaultToken(state: MultichainState) {
  const symbol = getMultichainIsEvm(state)
    ? getProviderConfig(state).ticker
    : getMultichainProviderConfig(state).ticker;

  return { symbol };
}
