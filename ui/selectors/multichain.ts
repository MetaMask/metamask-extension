import PropTypes from 'prop-types';
import { InternalAccount, isEvmAccountType } from '@metamask/keyring-api';
import type { RatesControllerState } from '@metamask/assets-controllers';
import { CaipChainId, Hex, KnownCaipNamespace } from '@metamask/utils';
import { createSelector } from 'reselect';
import { NetworkType } from '@metamask/controller-utils';
import { Numeric } from '../../shared/modules/Numeric';
import {
  MultichainProviderConfig,
  MULTICHAIN_PROVIDER_CONFIGS,
  MultichainNetworks,
  MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET,
} from '../../shared/constants/multichain/networks';
import {
  getCompletedOnboarding,
  getConversionRate,
  getNativeCurrency,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { BalancesControllerState } from '../../app/scripts/lib/accounts/BalancesController';
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_NETWORK_IDS,
  CHAIN_IDS,
} from '../../shared/constants/network';
import {
  getProviderConfig,
  NetworkState,
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
} from '../../shared/modules/selectors/networks';
import { AccountsState, getSelectedInternalAccount } from './accounts';
import {
  getIsMainnet,
  getMaybeSelectedInternalAccount,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getShowFiatInTestnets,
} from './selectors';

export type RatesState = {
  metamask: RatesControllerState;
};

export type BalancesState = {
  metamask: BalancesControllerState;
};

export type MultichainState = AccountsState &
  RatesState &
  BalancesState &
  NetworkState;

// TODO: Remove after updating to @metamask/network-controller 20.0.0
export type ProviderConfigWithImageUrlAndExplorerUrl = {
  rpcUrl?: string;
  type: NetworkType;
  chainId: Hex;
  ticker: string;
  nickname?: string;
  id?: string;
} & {
  rpcPrefs?: { blockExplorerUrl?: string; imageUrl?: string };
};

export type MultichainNetwork = {
  nickname: string;
  isEvmNetwork: boolean;
  chainId: CaipChainId;
  network: // TODO: Maybe updates ProviderConfig to add rpcPrefs.imageUrl field
  ProviderConfigWithImageUrlAndExplorerUrl | MultichainProviderConfig;
};

export const MultichainNetworkPropType = PropTypes.shape({
  nickname: PropTypes.string.isRequired,
  isEvmNetwork: PropTypes.bool.isRequired,
  chainId: PropTypes.string,
  network: PropTypes.oneOfType([
    PropTypes.shape({
      rpcUrl: PropTypes.string,
      type: PropTypes.string.isRequired,
      chainId: PropTypes.string.isRequired,
      ticker: PropTypes.string.isRequired,
      rpcPrefs: PropTypes.shape({
        blockExplorerUrl: PropTypes.string,
        imageUrl: PropTypes.string,
      }),
      nickname: PropTypes.string,
      id: PropTypes.string,
    }),
    PropTypes.shape({
      chainId: PropTypes.string.isRequired,
      ticker: PropTypes.string.isRequired,
      rpcPrefs: PropTypes.shape({
        blockExplorerUrl: PropTypes.string,
        imageUrl: PropTypes.string,
      }),
    }),
  ]).isRequired,
});

export const InternalAccountPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  metadata: PropTypes.shape({
    name: PropTypes.string.isRequired,
    snap: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      enabled: PropTypes.bool,
    }),
    keyring: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  type: PropTypes.string.isRequired,
});

export function getMultichainNetworkProviders(
  _state: MultichainState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}

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

// FIXME: All the following might have side-effect, like if the current account is a bitcoin one and that
// a popup (for ethereum related stuffs) is being shown (and uses this function), then the native
// currency will be BTC..

export function getMultichainIsEvm(
  state: MultichainState,
  account?: InternalAccount,
) {
  const isOnboarded = getCompletedOnboarding(state);
  // Selected account is not available during onboarding (this is used in
  // the AppHeader)
  const selectedAccount = account ?? getMaybeSelectedInternalAccount(state);

  // There are no selected account during onboarding. we default to the original EVM behavior.
  return (
    !isOnboarded || !selectedAccount || isEvmAccountType(selectedAccount.type)
  );
}

export function getMultichainIsBitcoin(
  state: MultichainState,
  account?: InternalAccount,
) {
  const isEvm = getMultichainIsEvm(state, account);
  const { symbol } = getMultichainDefaultToken(state, account);

  return !isEvm && symbol === 'BTC';
}

/**
 * Retrieves the provider configuration for a multichain network.
 *
 * This function extracts the `network` field from the result of `getMultichainNetwork(state)`,
 * which is expected to be a `MultichainProviderConfig` object. The naming might suggest that
 * it returns a network, but it actually returns a provider configuration specific to a multichain setup.
 *
 * @param state - The redux state.
 * @param account - The multichain account.
 * @returns The current multichain provider configuration.
 */
export function getMultichainProviderConfig(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainNetwork(state, account).network;
}

export function getMultichainCurrentNetwork(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainProviderConfig(state, account);
}

export function getMultichainNativeCurrency(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainIsEvm(state, account)
    ? getNativeCurrency(state)
    : getMultichainProviderConfig(state, account).ticker;
}

export function getMultichainCurrentCurrency(
  state: MultichainState,
  account?: InternalAccount,
) {
  const currentCurrency = getCurrentCurrency(state);

  if (getMultichainIsEvm(state, account)) {
    return currentCurrency;
  }

  // For non-EVM:
  // To mimic `getCurrentCurrency` we only consider fiat values, otherwise we
  // fallback to the current ticker symbol value
  return currentCurrency && currentCurrency.toLowerCase() === 'usd'
    ? 'usd'
    : getMultichainProviderConfig(state, account).ticker;
}

export function getMultichainCurrencyImage(
  state: MultichainState,
  account?: InternalAccount,
) {
  if (getMultichainIsEvm(state, account)) {
    return getNativeCurrencyImage(state);
  }

  const provider = getMultichainProviderConfig(
    state,
    account,
  ) as MultichainProviderConfig;
  return provider.rpcPrefs?.imageUrl;
}

export function getMultichainNativeCurrencyImage(
  state: MultichainState,
  account?: InternalAccount,
) {
  return getMultichainCurrencyImage(state, account);
}

export function getMultichainShouldShowFiat(
  state: MultichainState,
  account?: InternalAccount,
) {
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const isTestnet = getMultichainIsTestnet(state, selectedAccount);
  const isMainnet = !isTestnet;

  return getMultichainIsEvm(state, selectedAccount)
    ? getShouldShowFiat(state)
    : isMainnet || (isTestnet && getShowFiatInTestnets(state));
}

export function getMultichainDefaultToken(
  state: MultichainState,
  account?: InternalAccount,
) {
  const symbol = getMultichainIsEvm(state, account)
    ? // We fallback to 'ETH' to keep original behavior of `getSwapsDefaultToken`
      getProviderConfig(state)?.ticker ?? 'ETH'
    : getMultichainProviderConfig(state, account).ticker;

  return { symbol };
}

export function getMultichainCurrentChainId(state: MultichainState) {
  const { chainId } = getMultichainProviderConfig(state);
  return chainId;
}

export function isChainIdMainnet(chainId: string) {
  return chainId === CHAIN_IDS.MAINNET;
}

export function getMultichainIsMainnet(
  state: MultichainState,
  account?: InternalAccount,
) {
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const providerConfig = getMultichainProviderConfig(state, selectedAccount);

  if (getMultichainIsEvm(state, account)) {
    return getIsMainnet(state);
  }

  const mainnet = (
    MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET as Record<string, string>
  )[selectedAccount.type];
  return providerConfig.chainId === mainnet ?? false;
}

export function getMultichainIsTestnet(
  state: MultichainState,
  account?: InternalAccount,
) {
  // NOTE: Since there are 2 different implementations for `IsTestnet` and `IsMainnet` we follow
  // the same pattern here too!
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const providerConfig = getMultichainProviderConfig(state, selectedAccount);
  return getMultichainIsEvm(state, account)
    ? // FIXME: There are multiple ways of checking for an EVM test network, but
      // current implementation differ between each other. So we do not use
      // `getIsTestnet` here and uses the actual `TEST_NETWORK_IDS` which seems
      // more up-to-date
      (TEST_NETWORK_IDS as string[]).includes(providerConfig.chainId)
    : // TODO: For now we only check for bitcoin, but we will need to
      // update this for other non-EVM networks later!
      (providerConfig as MultichainProviderConfig).chainId ===
        MultichainNetworks.BITCOIN_TESTNET;
}

export function getMultichainBalances(
  state: MultichainState,
): BalancesState['metamask']['balances'] {
  return state.metamask.balances;
}

export const getMultichainCoinRates = (state: MultichainState) => {
  return state.metamask.rates;
};

function getNonEvmCachedBalance(state: MultichainState) {
  const balances = getMultichainBalances(state);
  const account = getSelectedInternalAccount(state);
  const network = getMultichainCurrentNetwork(state);

  // We assume that there's at least one asset type in and that is the native
  // token for that network.
  const asset =
    MULTICHAIN_NETWORK_TO_ASSET_TYPES[
      network.chainId as MultichainNetworks
    ]?.[0];

  return balances?.[account.id]?.[asset]?.amount;
}

export function getImageForChainId(chainId: string) {
  const evmChainIdKey =
    chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

  return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey];
}

// This selector is not compatible with `useMultichainSelector` since it uses the selected
// account implicitly!
export function getMultichainSelectedAccountCachedBalance(
  state: MultichainState,
) {
  return getMultichainIsEvm(state)
    ? getSelectedAccountCachedBalance(state)
    : getNonEvmCachedBalance(state);
}

export const getMultichainSelectedAccountCachedBalanceIsZero = createSelector(
  [getMultichainIsEvm, getMultichainSelectedAccountCachedBalance],
  (isEvm, balance) => {
    const base = isEvm ? 16 : 10;
    const numericBalance = new Numeric(balance, base);
    return numericBalance.isZero();
  },
);

export function getMultichainConversionRate(
  state: MultichainState,
  account?: InternalAccount,
) {
  const { ticker } = getMultichainProviderConfig(state, account);

  return getMultichainIsEvm(state, account)
    ? getConversionRate(state)
    : getMultichainCoinRates(state)?.[ticker.toLowerCase()]?.conversionRate;
}
