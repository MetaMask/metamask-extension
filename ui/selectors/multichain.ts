import PropTypes from 'prop-types';
import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId, Hex, KnownCaipNamespace } from '@metamask/utils';
import { createSelector } from 'reselect';
import { NetworkType } from '@metamask/controller-utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
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
  MetaMaskSliceControllerState,
} from '../ducks/metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_NETWORK_IDS,
  CHAIN_IDS,
} from '../../shared/constants/network';
import {
  getProviderConfig,
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
} from '../../shared/modules/selectors/networks';
import { BackgroundStateProxy } from '../../shared/types/metamask';
import { getSelectedInternalAccount } from './accounts';
import {
  getIsMainnet,
  getMaybeSelectedInternalAccount,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getShowFiatInTestnets,
} from './selectors';

export type RatesState =
  MetaMaskSliceControllerState<'MultichainRatesController'>;

export type BalancesState =
  MetaMaskSliceControllerState<'MultichainBalancesController'>;

export type MultichainState = Pick<
  BackgroundStateProxy,
  'AccountsController' | 'NetworkController'
> &
  RatesState &
  BalancesState;

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

export function getMultichainNetworkProviders(): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}

// FIXME: All the following might have side-effect, like if the current account is a bitcoin one and that
// a popup (for ethereum related stuffs) is being shown (and uses this function), then the native
// currency will be BTC..

export const getMultichainIsEvm = createDeepEqualSelector(
  (_state: Record<never, never>, account?: InternalAccount) => account,
  getCompletedOnboarding,
  getMaybeSelectedInternalAccount,
  (account, isOnboarded, maybeSelectedInternalAccount) => {
    // Selected account is not available during onboarding (this is used in
    // the AppHeader)
    const selectedAccount = account ?? maybeSelectedInternalAccount;

    // There are no selected account during onboarding. we default to the original EVM behavior.
    return (
      !isOnboarded || !selectedAccount || isEvmAccountType(selectedAccount.type)
    );
  },
);

export const getMultichainDefaultToken = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainIsEvm>[0] &
      Parameters<typeof getMultichainProviderConfig>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  getProviderConfig,
  ({ state, account }, { ticker }) => {
    const symbol = getMultichainIsEvm(state, account)
      ? // We fallback to 'ETH' to keep original behavior of `getSwapsDefaultToken`
        ticker ?? 'ETH'
      : getMultichainProviderConfig(state, account).ticker;

    return { symbol };
  },
);

export const getMultichainIsBitcoin = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainIsEvm>[0] &
      Parameters<typeof getMultichainDefaultToken>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  ({ state, account }) => {
    const isEvm = getMultichainIsEvm(state, account);
    const { symbol } = getMultichainDefaultToken(state, account);

    return !isEvm && symbol === 'BTC';
  },
);

export const getMultichainNetwork = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainIsEvm>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  getCurrentChainId,
  getProviderConfig,
  getNetworkConfigurationsByChainId,
  getSelectedInternalAccount,
  getMultichainNetworkProviders,
  (
    { state, account },
    evmChainId,
    evmNetwork,
    networkConfigurations,
    selectedInternalAccount,
    nonEvmNetworks,
  ) => {
    const isEvm = getMultichainIsEvm(state, account);

    if (isEvm) {
      const evmChainIdKey =
        evmChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

      // TODO: Update to use network configurations when @metamask/network-controller is updated to 20.0.0
      // ProviderConfig will be deprecated to use NetworkConfigurations
      // When a user updates a network name its only updated in the NetworkConfigurations.
      (evmNetwork as ProviderConfigWithImageUrlAndExplorerUrl).rpcPrefs = {
        ...evmNetwork.rpcPrefs,
        imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey],
      };

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
    const selectedAccount = account ?? selectedInternalAccount;
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
  },
);

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
  state: Parameters<typeof getMultichainNetwork>[0],
  account?: InternalAccount,
) {
  return getMultichainNetwork(state, account).network;
}

export function getMultichainCurrentNetwork(
  state: Parameters<typeof getMultichainProviderConfig>[0],
  account?: InternalAccount,
) {
  return getMultichainProviderConfig(state, account);
}

export function getMultichainNativeCurrency(
  state: Parameters<typeof getMultichainIsEvm>[0] &
    Parameters<typeof getNativeCurrency>[0] &
    Parameters<typeof getMultichainProviderConfig>[0],
  account?: InternalAccount,
) {
  return getMultichainIsEvm(state, account)
    ? getNativeCurrency(state)
    : getMultichainProviderConfig(state, account).ticker;
}

export function getMultichainCurrentCurrency(
  state: Parameters<typeof getCurrentCurrency>[0],
) {
  return getCurrentCurrency(state);
}

export function getMultichainCurrencyImage(
  state: Parameters<typeof getMultichainNetwork>[0],
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
  state: Parameters<typeof getMultichainCurrencyImage>[0],
  account?: InternalAccount,
) {
  return getMultichainCurrencyImage(state, account);
}

export const getMultichainIsTestnet = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainProviderConfig>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  getSelectedInternalAccount,
  ({ state, account }, selectedInternalAccount) => {
    // NOTE: Since there are 2 different implementations for `IsTestnet` and `IsMainnet` we follow
    // the same pattern here too!
    const selectedAccount = account ?? selectedInternalAccount;
    const providerConfig = getMultichainProviderConfig(state, selectedAccount);
    return getMultichainIsEvm(state, account)
      ? // FIXME: There are multiple ways of checking for an EVM test network, but
        // current implementation differ between each other. So we do not use
        // `getIsTestnet` here and uses the actual `TEST_NETWORK_IDS` which seems
        // more up-to-date
        TEST_NETWORK_IDS.find((testId) => testId === providerConfig.chainId) !==
          undefined
      : // TODO: For now we only check for bitcoin, but we will need to
        // update this for other non-EVM networks later!
        (providerConfig as MultichainProviderConfig).chainId ===
          MultichainNetworks.BITCOIN_TESTNET;
  },
);

export const getMultichainShouldShowFiat = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainIsTestnet>[0] &
      Parameters<typeof getMultichainIsEvm>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  getSelectedInternalAccount,
  getShouldShowFiat,
  getShowFiatInTestnets,
  (
    { state, account },
    selectedInternalAccount,
    shouldShowFiat,
    showFiatInTestnets,
  ) => {
    const selectedAccount = account ?? selectedInternalAccount;
    const isTestnet = getMultichainIsTestnet(state, selectedAccount);
    const isMainnet = !isTestnet;

    return getMultichainIsEvm(state, selectedAccount)
      ? shouldShowFiat
      : isMainnet || (isTestnet && showFiatInTestnets);
  },
);

export const getMultichainCurrentChainId = createDeepEqualSelector(
  getMultichainProviderConfig,
  ({ chainId }) => chainId,
);

export function isChainIdMainnet(chainId: string) {
  return chainId === CHAIN_IDS.MAINNET;
}

export const getMultichainIsMainnet = createDeepEqualSelector(
  (
    state: Parameters<typeof getMultichainProviderConfig>[0] &
      Parameters<typeof getMultichainIsEvm>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  getSelectedInternalAccount,
  getIsMainnet,
  ({ state, account }, selectedInternalAccount, isMainnet) => {
    const selectedAccount = account ?? selectedInternalAccount;
    const providerConfig = getMultichainProviderConfig(state, selectedAccount);

    if (getMultichainIsEvm(state, account)) {
      return isMainnet;
    }

    const mainnet = (
      MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET as Record<string, string>
    )[selectedAccount.type];
    return providerConfig.chainId === mainnet;
  },
);

export function getMultichainBalances(
  state: MetaMaskSliceControllerState<'MultichainBalancesController'>,
) {
  return state.metamask.MultichainBalancesController.balances;
}

export const getMultichainCoinRates = (
  state: MetaMaskSliceControllerState<'MultichainRatesController'>,
) => {
  return state.metamask.MultichainRatesController.rates;
};

const getNonEvmCachedBalance = createDeepEqualSelector(
  (_state: Record<never, never>, account?: InternalAccount) => account,
  getMultichainBalances,
  getSelectedInternalAccount,
  getMultichainCurrentNetwork,
  (account, balances, selectedInternalAccount, network) => {
    const selectedAccount = account ?? selectedInternalAccount;

    // We assume that there's at least one asset type in and that is the native
    // token for that network.
    const asset =
      MULTICHAIN_NETWORK_TO_ASSET_TYPES[
        network.chainId as MultichainNetworks
      ]?.[0];

    if (!asset) {
      console.warn('Could not find asset type for network:', network);
    }

    const balancesForAccount = balances?.[selectedAccount.id];
    if (!balancesForAccount) {
      console.warn('Could not find balances for account:', selectedAccount);
    }

    const balanceOfAsset = balancesForAccount?.[asset];
    if (!balanceOfAsset) {
      console.warn('Could not find balance for asset:', asset);
    }

    return balanceOfAsset?.amount ?? 0;
  },
);

export function getImageForChainId(chainId: string) {
  const evmChainIdKey =
    chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

  return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey];
}

// This selector is not compatible with `useMultichainSelector` since it uses the selected
// account implicitly!
export const getMultichainSelectedAccountCachedBalance =
  createDeepEqualSelector(
    getMultichainIsEvm,
    getSelectedAccountCachedBalance,
    getNonEvmCachedBalance,
    (isEvm, selectedAccountCachedBalance, nonEvmCachedBalance) =>
      isEvm ? selectedAccountCachedBalance : nonEvmCachedBalance,
  );

export const getMultichainSelectedAccountCachedBalanceIsZero = createSelector(
  [getMultichainIsEvm, getMultichainSelectedAccountCachedBalance],
  (isEvm, balance) => {
    const base = isEvm ? 16 : 10;
    const numericBalance = new Numeric(balance, base);
    return numericBalance.isZero();
  },
);

export const getMultichainConversionRate = createDeepEqualSelector(
  getConversionRate,
  getMultichainCoinRates,
  (
    state: Parameters<typeof getMultichainProviderConfig>[0] &
      Parameters<typeof getMultichainIsEvm>[0],
    account?: InternalAccount,
  ) => ({ state, account }),
  (conversionRate, multichainCoinRates, { state, account }) => {
    const { ticker } = getMultichainProviderConfig(state, account);

    return getMultichainIsEvm(state, account)
      ? conversionRate
      : multichainCoinRates?.[ticker.toLowerCase()]?.conversionRate;
  },
);
