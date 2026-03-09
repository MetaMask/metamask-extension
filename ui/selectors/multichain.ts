import type {
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  MultichainBalancesControllerState,
  RatesControllerState,
} from '@metamask/assets-controllers';
import { isEvmAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { isBtcTestnetAddress } from '@metamask/keyring-utils';

import {
  NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import { CaipChainId, Hex } from '@metamask/utils';
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
  getMultichainAssetsRatesControllerConversionRates,
  getMultiChainBalancesControllerBalances,
} from '../../shared/modules/selectors/assets-migration';
import {
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
  isTronAccount,
} from './accounts';
import {
  getIsMainnet,
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getShouldShowFiat,
  getShowFiatInTestnets,
  getUseCurrencyRateCheck,
} from './selectors';
import {
  getSelectedMultichainNetworkConfiguration,
  type MultichainNetworkConfigState,
  getMultichainNetwork,
  getMultichainIsEvm,
} from './multichain/networks';

// TODO: Update all references to use networks.ts
export { getMultichainNetwork, getMultichainIsEvm };

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

export type RatesState = {
  metamask: RatesControllerState;
};

type BalancesState = {
  metamask: MultichainBalancesControllerState;
};

type TransactionsState = {
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

export { getCurrentCurrency as getMultichainCurrentCurrency };

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

  if (!mainnet) {
    return false;
  }

  // If it's Bitcoin case, check if it's a testnet address
  if (isBtcTestnetAddress(selectedAccount.address)) {
    return false;
  }

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

  if (getMultichainIsEvm(state, account)) {
    // FIXME: There are multiple ways of checking for an EVM test network, but
    // current implementation differ between each other. So we do not use
    // `getIsTestnet` here and uses the actual `TEST_NETWORK_IDS` which seems
    // more up-to-date
    return (TEST_NETWORK_IDS as string[]).includes(providerConfig.chainId);
  }

  // For Bitcoin case, check address format as well
  if (isBtcTestnetAddress(selectedAccount.address)) {
    return true;
  }

  // TODO: For now we only check for Bitcoin, Solana, and Tron, but we will need to
  // update this for other non-EVM networks later!
  return [
    MultichainNetworks.BITCOIN_TESTNET,
    MultichainNetworks.BITCOIN_SIGNET,
    MultichainNetworks.SOLANA_DEVNET,
    MultichainNetworks.SOLANA_TESTNET,
    MultichainNetworks.TRON_NILE,
    MultichainNetworks.TRON_SHASTA,
  ].includes(providerConfig.chainId as MultichainNetworks);
}

// TODO: Update all references to use asset-migration.ts
export { getMultiChainBalancesControllerBalances as getMultichainBalances };

export const getMultichainCoinRates = (state: MultichainState) => {
  return state.metamask.rates;
};

function getNonEvmCachedBalance(
  state: MultichainState,
  account?: InternalAccount,
) {
  const balances = getMultiChainBalancesControllerBalances(state);
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const selectedNetworkConfig =
    getSelectedMultichainNetworkConfiguration(state);

  // Prefer the fully resolved selected network configuration, but fall back to the
  // selected multichain chain ID (works even if feature flags filter out config)
  const chainId = (selectedNetworkConfig?.chainId ??
    state.metamask.selectedMultichainNetworkChainId) as CaipChainId;

  // We assume that there's at least one asset type in and that is the native
  // token for that network.
  const asset =
    MULTICHAIN_NETWORK_TO_ASSET_TYPES[chainId as MultichainNetworks]?.[0];

  if (!asset) {
    console.warn('Could not find asset type for chainId:', chainId);
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
  const { chainId } = getMultichainNetwork(state, account);

  const conversionRate = getMultichainIsEvm(state, account)
    ? getConversionRate(state)
    : getConversionRatesForNativeAsset({
        conversionRates:
          getMultichainAssetsRatesControllerConversionRates(state),
        chainId,
      })?.rate;

  const parsedConversionRate =
    conversionRate === null || conversionRate === undefined
      ? undefined
      : Number(conversionRate);

  return parsedConversionRate;
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
      name: MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON].nickname ?? '',
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
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_NILE].nickname ??
        '',
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
        MULTICHAIN_PROVIDER_CONFIGS[MultichainNetworks.TRON_SHASTA].nickname ??
        '',
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

export const getLastSelectedNonEvmAccount = createSelector(
  getInternalAccounts,
  (nonEvmAccounts) => {
    const sortedNonEvmAccounts = nonEvmAccounts
      .filter((account) => !isEvmAccountType(account.type))
      .sort(
        (a, b) =>
          (b.metadata.lastSelected ?? 0) - (a.metadata.lastSelected ?? 0),
      );
    return sortedNonEvmAccounts.length > 0
      ? sortedNonEvmAccounts[0]
      : undefined;
  },
);

export const getLastSelectedSolanaAccount = createSelector(
  getInternalAccounts,
  (nonEvmAccounts) => {
    const sortedNonEvmAccounts = nonEvmAccounts
      .filter((account) => isSolanaAccount(account))
      .sort(
        (a, b) =>
          (b.metadata.lastSelected ?? 0) - (a.metadata.lastSelected ?? 0),
      );
    return sortedNonEvmAccounts.length > 0
      ? sortedNonEvmAccounts[0]
      : undefined;
  },
);

export function getLastSelectedTronAccount(state: MultichainState) {
  const nonEvmAccounts = getInternalAccounts(state);
  const sortedNonEvmAccounts = nonEvmAccounts
    .filter((account) => isTronAccount(account))
    .sort(
      (a, b) => (b.metadata.lastSelected ?? 0) - (a.metadata.lastSelected ?? 0),
    );
  return sortedNonEvmAccounts.length > 0 ? sortedNonEvmAccounts[0] : undefined;
}
