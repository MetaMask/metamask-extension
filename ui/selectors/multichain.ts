import type {
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
} from '@metamask/assets-controllers';
import { NetworkType } from '@metamask/controller-utils';
import { isEvmAccountType, Transaction } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { CaipChainId, Hex, KnownCaipNamespace } from '@metamask/utils';
import PropTypes from 'prop-types';
import { createSelector } from 'reselect';
import {
  MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET,
  MULTICHAIN_PROVIDER_CONFIGS,
  MULTICHAIN_TOKEN_IMAGE_MAP,
  MultichainNetworks,
  MultichainProviderConfig,
} from '../../shared/constants/multichain/networks';
import { Numeric } from '../../shared/modules/Numeric';
import {
  getCompletedOnboarding,
  getConversionRate,
  getCurrentCurrency,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { MULTICHAIN_NETWORK_TO_ASSET_TYPES } from '../../shared/constants/multichain/assets';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_IDS,
  TEST_NETWORK_IDS,
} from '../../shared/constants/network';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getProviderConfig,
  NetworkState,
} from '../../shared/modules/selectors/networks';
// eslint-disable-next-line import/no-restricted-paths
import { getConversionRatesForNativeAsset } from '../../app/scripts/lib/util';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import {
  AccountsState,
  getInternalAccounts,
  getSelectedInternalAccount,
  isSolanaAccount,
} from './accounts';
import {
  getSelectedMultichainNetworkConfiguration,
  type MultichainNetworkConfigState,
} from './multichain/networks';
import {
  getIsMainnet,
  getMaybeSelectedInternalAccount,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getShowFiatInTestnets,
  getUseCurrencyRateCheck,
} from './selectors';

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

export type RatesState = {
  metamask: RatesControllerState;
};

export type BalancesState = {
  metamask: MultichainBalancesControllerState;
};

export type TransactionsState = {
  metamask: MultichainTransactionsControllerState;
};

export type MultichainState = AccountsState &
  RatesState &
  BalancesState &
  TransactionsState &
  NetworkState &
  AssetsRatesState &
  AssetsState &
  MultichainNetworkConfigState;

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
    return selectedAccount.scopes.includes(provider.chainId);
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

export function getMultichainIsSolana(
  state: MultichainState,
  account?: InternalAccount,
) {
  const isEvm = getMultichainIsEvm(state, account);
  const { symbol } = getMultichainDefaultToken(state, account);

  return !isEvm && symbol === 'SOL';
}

export function getMultichainIsTron(
  state: MultichainState,
  account?: InternalAccount,
) {
  const isEvm = getMultichainIsEvm(state, account);
  const { symbol } = getMultichainDefaultToken(state, account);

  return !isEvm && symbol === 'TRX';
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

export function getMultichainCurrentCurrency(state: MultichainState) {
  return getCurrentCurrency(state);
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

export const makeGetMultichainShouldShowFiatByChainId =
  (chainId: Hex | CaipChainId) =>
  (state: MultichainState, account?: InternalAccount) =>
    getMultichainShouldShowFiat(state, account, chainId);

export function getMultichainShouldShowFiat(
  state: MultichainState,
  account?: InternalAccount,
  chainId?: Hex | CaipChainId,
) {
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const isTestnet = getMultichainIsTestnet(state, selectedAccount);
  const isMainnet = !isTestnet;
  const useCurrencyRateCheck = getUseCurrencyRateCheck(state);

  return getMultichainIsEvm(state, selectedAccount)
    ? getShouldShowFiat(state, chainId)
    : (useCurrencyRateCheck && isMainnet) ||
        (useCurrencyRateCheck && isTestnet && getShowFiatInTestnets(state));
}

export function getMultichainDefaultToken(
  state: MultichainState,
  account?: InternalAccount,
) {
  const symbol = getMultichainIsEvm(state, account)
    ? // We fallback to 'ETH' to keep original behavior of `getSwapsDefaultToken`
      (getProviderConfig(state)?.ticker ?? 'ETH')
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
  return providerConfig.chainId === mainnet;
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
    : // TODO: For now we only check for bitcoin and Solana, but we will need to
      // update this for other non-EVM networks later!
      (
        [
          MultichainNetworks.BITCOIN_TESTNET,
          MultichainNetworks.BITCOIN_SIGNET,
          MultichainNetworks.SOLANA_DEVNET,
          MultichainNetworks.SOLANA_TESTNET,
        ] as string[]
      ).includes(providerConfig.chainId);
}

export function getMultichainBalances(
  state: MultichainState,
): BalancesState['metamask']['balances'] {
  return state.metamask.balances;
}

export function getMultichainTransactions(
  state: MultichainState,
): TransactionsState['metamask']['nonEvmTransactions'] {
  return state.metamask.nonEvmTransactions;
}

export function getSelectedAccountMultichainTransactions(
  state: MultichainState,
):
  | { transactions: Transaction[]; next: string | null; lastUpdated: number }
  | undefined {
  const selectedAccount = getSelectedInternalAccount(state);

  if (isEvmAccountType(selectedAccount.type)) {
    return undefined;
  }

  return state.metamask.nonEvmTransactions[selectedAccount.id];
}

export const getMultichainCoinRates = (state: MultichainState) => {
  return state.metamask.rates;
};

function getNonEvmCachedBalance(
  state: MultichainState,
  account?: InternalAccount,
) {
  const balances = getMultichainBalances(state);
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const network = getSelectedMultichainNetworkConfiguration(state);

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
}

export function getImageForChainId(chainId: string): string | undefined {
  return {
    ...CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
    ...MULTICHAIN_TOKEN_IMAGE_MAP,
  }[chainId];
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
  const { conversionRates } = state.metamask;
  const { chainId } = getMultichainNetwork(state, account);
  const conversionRate = getConversionRatesForNativeAsset({
    conversionRates,
    chainId,
  })?.rate;

  return getMultichainIsEvm(state, account)
    ? getConversionRate(state)
    : conversionRate;
}

// TODO get this from the multichain network controller
export const getMultichainNetworkConfigurationsByChainId = (
  state: MultichainState,
): Record<Hex | CaipChainId, NetworkConfiguration> => {
  return {
    ...getNetworkConfigurationsByChainId(state),
    [MultichainNetworks.SOLANA]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.SOLANA].nickname ?? '',
      nativeCurrency: 'sol',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.SOLANA as unknown as Hex,
    },
    [MultichainNetworks.BITCOIN]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN].nickname ?? '',
      nativeCurrency: 'BTC',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.BITCOIN as unknown as Hex,
    },
    [MultichainNetworks.BITCOIN_TESTNET]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN_TESTNET],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN_TESTNET]
          .nickname ?? '',
      nativeCurrency: 'tBTC',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.BITCOIN_TESTNET as unknown as Hex,
    },
    [MultichainNetworks.BITCOIN_SIGNET]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN_SIGNET],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.BITCOIN_SIGNET]
          .nickname ?? '',
      nativeCurrency: 'sBTC',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.BITCOIN_SIGNET as unknown as Hex,
    },
    [MultichainNetworks.TRON]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON].nickname ?? '',
      nativeCurrency: 'TRX',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.TRON as unknown as Hex,
    },
    [MultichainNetworks.TRON_NILE]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_NILE],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_NILE].nickname ?? '',
      nativeCurrency: 'TRX',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.TRON_NILE as unknown as Hex,
    },
    [MultichainNetworks.TRON_SHASTA]: {
      ...MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_SHASTA],
      blockExplorerUrls: [],
      name:
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_SHASTA].nickname ?? '',
      nativeCurrency: 'TRX',
      rpcEndpoints: [
        { url: '', type: RpcEndpointType.Custom, networkClientId: '' },
      ],
      defaultRpcEndpointIndex: 0,
      chainId: MultichainNetworks.TRON_SHASTA as unknown as Hex,
    },
  };
};

export const getMemoizedMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    [getMultichainNetworkConfigurationsByChainId],
    (networkConfigurations) => networkConfigurations,
  );

export function getLastSelectedNonEvmAccount(state: MultichainState) {
  const nonEvmAccounts = getInternalAccounts(state);
  const sortedNonEvmAccounts = nonEvmAccounts
    .filter((account) => !isEvmAccountType(account.type))
    .sort(
      (a, b) => (b.metadata.lastSelected ?? 0) - (a.metadata.lastSelected ?? 0),
    );
  return sortedNonEvmAccounts.length > 0 ? sortedNonEvmAccounts[0] : undefined;
}

export function getLastSelectedSolanaAccount(state: MultichainState) {
  const nonEvmAccounts = getInternalAccounts(state);
  const sortedNonEvmAccounts = nonEvmAccounts
    .filter((account) => isSolanaAccount(account))
    .sort(
      (a, b) => (b.metadata.lastSelected ?? 0) - (a.metadata.lastSelected ?? 0),
    );
  return sortedNonEvmAccounts.length > 0 ? sortedNonEvmAccounts[0] : undefined;
}
