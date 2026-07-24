import {
  AccountGroupAssets,
  AssetListState,
  DeFiPositionsControllerState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  calculateBalanceChangeForAllWallets,
  calculateBalanceForAllWallets,
  calculateBalanceChangeForAccountGroup,
  selectAssetsBySelectedAccountGroup,
} from '@metamask/assets-controllers';
import {
  AssetsControllerState,
  getDefaultAssetsControllerState,
} from '@metamask/assets-controller';
import { CaipAssetId, isEvmAccountType } from '@metamask/keyring-api';
import { toHex } from '@metamask/controller-utils';
import {
  CaipAssetType,
  CaipChainId,
  Hex,
  KnownCaipNamespace,
  hasProperty,
  isCaipAssetType,
  isObject,
  isStrictHexString,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { groupBy } from 'lodash';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { createSelector } from 'reselect';
import {
  getDefaultAccountTreeControllerState,
  type AccountTreeControllerState,
} from '@metamask/account-tree-controller';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type {
  TokenBalancesControllerState,
  TokenRatesControllerState,
  MultichainBalancesControllerState,
  TokensControllerState,
  CurrencyRateState,
  BalanceChangePeriod,
  BalanceChangeResult,
  AccountTrackerControllerState,
} from '@metamask/assets-controllers';
import { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  ARC_USDC_TOKEN_ADDRESS,
  CHAIN_IDS,
  TEST_CHAINS,
} from '../../shared/constants/network';
import {
  createDeepEqualSelector,
  createParameterizedSelector,
} from '../../shared/lib/selectors/selector-creators';
import { Token, TokenWithFiatAmount } from '../components/app/assets/types';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../components/app/assets/util/calculateTokenFiatAmount';
import {
  getTokenBalances,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
import { findAssetByAddress } from '../pages/asset/util';
import { isEvmChainId, toAssetId } from '../../shared/lib/asset-utils';
import type { ResolvedAssetRoute } from '../../shared/lib/asset-route';
import { isEmptyHexString } from '../../shared/lib/hexstring-utils';
import { isZeroAmount } from '../helpers/utils/number-utils';
import {
  getNetworkConfigurationsByChainId,
  getNonTestNetworks,
  NetworkState,
} from '../../shared/lib/selectors/networks';
import {
  getAccountTrackerControllerAccountsByChainId,
  getCurrencyRateControllerCurrencyRates,
  getCurrencyRateControllerCurrentCurrency,
  getIsAssetsUnifyStateEnabled,
  getMultiChainAssetsControllerAccountsAssets,
  getMultiChainAssetsControllerAllIgnoredAssets,
  getMultiChainAssetsControllerAssetsMetadata,
  getMultichainAssetsRatesControllerConversionRates,
  getMultiChainBalancesControllerBalances,
  getTokenBalancesControllerTokenBalances,
  getTokenRatesControllerMarketData,
  getTokensControllerAllIgnoredTokens,
  getTokensControllerAllTokens,
} from '../../shared/lib/selectors/assets-migration';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getPreferences } from '../../shared/lib/selectors/preferences';
import { augmentAssetControllersState } from '../components/app/assets/enablement/arc';
import {
  calculateBalanceForAllWallets as calculateBalanceForAllWalletsFromUnified,
  calculateBalanceChangeForAccountGroup as calculateBalanceChangeForAccountGroupFromUnified,
} from './assets.balance-utils';
import { getAccountIdByAddress, getInternalAccountsObject } from './accounts';
import { getMultichainBalances, RatesState } from './multichain';
import { EMPTY_OBJECT } from './shared';
import {
  getAllTokens,
  getCurrencyRates,
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNativeTokenCachedBalanceByChainIdSelector,
  getSelectedAccountTokensAcrossChains,
  getTokensAcrossChainsByAccountAddressSelector,
  getEnabledNetworks,
} from './selectors';
import {
  getAllEnabledNetworksForAllNamespaces,
  getSelectedMultichainNetworkConfiguration,
  MultichainNetworkControllerState,
} from './multichain/networks';
import { getInternalAccountBySelectedAccountGroupAndCaip } from './multichain-accounts/account-tree';

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

export type DefiState = {
  metamask: DeFiPositionsControllerState;
};

// Type for the main Redux state that includes all controller states needed for balance calculations
export type BalanceCalculationState = {
  metamask: AccountTreeControllerState &
    AccountsControllerState &
    TokenBalancesControllerState &
    TokenRatesControllerState &
    MultichainBalancesControllerState &
    TokensControllerState &
    CurrencyRateState &
    MultichainAssetsRatesControllerState &
    MultichainAssetsControllerState &
    AccountTrackerControllerState &
    NetworkEnablementControllerState &
    RemoteFeatureFlagControllerState &
    AssetsControllerState &
    MultichainNetworkControllerState['metamask'] &
    RatesState['metamask'] & {
      networkConfigurationsByChainId: NetworkState['metamask']['networkConfigurationsByChainId'];
      snaps: Record<string, { enabled: boolean }>;
    };
};

export { getMultiChainAssetsControllerAccountsAssets as getAccountAssets };

export { getMultiChainAssetsControllerAssetsMetadata as getAssetsMetadata };

const defaultState = getDefaultAssetsControllerState();

/**
 * Returns the assets info (AssetsController state).
 *
 * @param state - Redux state object.
 * @param state.metamask - MetaMask slice.
 * @returns Assets info map or empty object.
 */
export function getAssetsInfo(state: { metamask?: AssetsControllerState }) {
  return state.metamask?.assetsInfo ?? defaultState.assetsInfo;
}

/**
 * Returns the assets balance (AssetsController state).
 *
 * @param state - Redux state object.
 * @param state.metamask - MetaMask slice.
 * @returns Assets balance map or empty object.
 */
export function getAssetsBalance(state: { metamask?: AssetsControllerState }) {
  return state.metamask?.assetsBalance ?? defaultState.assetsBalance;
}

/**
 * Returns the assets price (AssetsController state).
 *
 * @param state - Redux state object.
 * @param state.metamask - MetaMask slice.
 * @returns Assets price map or empty object.
 */
export function getAssetsPrice(state: { metamask?: AssetsControllerState }) {
  return state.metamask?.assetsPrice ?? defaultState.assetsPrice;
}

/**
 * Returns the asset preferences (AssetsController state).
 *
 * @param state - Redux state object.
 * @param state.metamask - MetaMask slice.
 * @returns Asset preferences map or empty object.
 */
export function getAssetPreferences(state: {
  metamask?: AssetsControllerState;
}) {
  return state.metamask?.assetPreferences ?? defaultState.assetPreferences;
}

/**
 * Returns the custom assets (AssetsController state).
 *
 * @param state - Redux state object.
 * @param state.metamask - MetaMask slice.
 * @returns Custom assets map or empty object.
 */
export function getCustomAssets(state: { metamask?: AssetsControllerState }) {
  return state.metamask?.customAssets ?? defaultState.customAssets;
}

export function getSelectedCurrency(state: {
  metamask?: AssetsControllerState;
}) {
  return state.metamask?.selectedCurrency ?? defaultState.selectedCurrency;
}

/**
 * Gets non-EVM accounts assets rates.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export { getMultichainAssetsRatesControllerConversionRates as getAssetsRates };

/**
 * Gets DeFi positions
 *
 * @param state - Redux state object.
 * @returns An object containing defi positions for all accounts
 */
export function getDefiPositions(
  state: DefiState,
): DeFiPositionsControllerState['allDeFiPositions'] {
  return state?.metamask?.allDeFiPositions;
}

/**
 * @deprecated use selectBalanceByAccountGroup instead
 */
export const getTokenBalancesEvm = createSelector(
  getTokensAcrossChainsByAccountAddressSelector,
  getNativeTokenCachedBalanceByChainIdSelector,
  getTokenBalances,
  (_state, accountAddress) => accountAddress,
  getMarketData,
  getCurrencyRates,
  getPreferences,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getCurrentNetwork,
  (
    selectedAccountTokensChains,
    nativeBalances,
    tokenBalances,
    selectedAccountAddress,
    marketData,
    currencyRates,
    preferences,
    isOnCurrentNetwork,
    currentNetwork,
  ) => {
    const { hideZeroBalanceTokens } = preferences;
    const selectedAccountTokenBalancesAcrossChains =
      tokenBalances[selectedAccountAddress];

    // we need to filter Testnets
    const isTestNetwork = TEST_CHAINS.includes(currentNetwork.chainId);
    const filteredAccountTokensChains = Object.fromEntries(
      Object.entries(selectedAccountTokensChains).filter(([chainId]) =>
        isTestNetwork
          ? TEST_CHAINS.includes(chainId as (typeof TEST_CHAINS)[number])
          : !TEST_CHAINS.includes(chainId as (typeof TEST_CHAINS)[number]),
      ),
    );
    const tokensWithBalance: TokenWithFiatAmount[] = [];
    Object.entries(filteredAccountTokensChains).forEach(
      ([stringChainKey, tokens]) => {
        const chainId = stringChainKey as Hex;
        const tokenList = tokens as Token[];
        tokenList.forEach((token: Token) => {
          const { isNative, address, decimals } = token;

          const balance =
            calculateTokenBalance({
              isNative,
              chainId,
              address: address as Hex,
              decimals,
              nativeBalances,
              selectedAccountTokenBalancesAcrossChains,
            }) || '0';

          const tokenFiatAmount = calculateTokenFiatAmount({
            token,
            chainId,
            balance,
            marketData,
            currencyRates,
          });

          // Respect the "hide zero balance" setting (when true):
          // - Native tokens should always display with zero balance when on the current network filter.
          // - Native tokens should not display with zero balance when on all networks filter
          // - ERC20 tokens with zero balances should respect the setting on both the current and all networks.

          // Respect the "hide zero balance" setting (when false):
          // - Native tokens should always display with zero balance when on the current network filter.
          // - Native tokens should always display with zero balance when on all networks filter
          // - ERC20 tokens always display with zero balance on both the current and all networks filter.
          if (
            !hideZeroBalanceTokens ||
            balance !== '0' ||
            (token.isNative && isOnCurrentNetwork)
          ) {
            // title is used for sorting. We override native ETH to Ethereum
            let title;
            if (token.isNative) {
              title = token.symbol === 'ETH' ? 'Ethereum' : token.symbol;
            } else {
              title = token.name || token.symbol;
            }

            tokensWithBalance.push({
              ...token,
              address: token.address as CaipAssetType,
              assetId: token.assetId as CaipAssetType | undefined,
              balance,
              tokenFiatAmount,
              chainId: chainId as CaipChainId,
              string: String(balance),
              secondary: 0,
              title,
            });
          }
        });
      },
    );
    return tokensWithBalance;
  },
);

/**
 * @deprecated use getAllAssets instead
 */
export const getMultiChainAssets = createSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getMultiChainAssetsControllerAccountsAssets,
  getMultiChainAssetsControllerAssetsMetadata,
  getMultichainAssetsRatesControllerConversionRates,
  getPreferences,
  (
    selectedAccountAddress,
    multichainBalances,
    accountAssets,
    assetsMetadata,
    assetRates,
    preferences,
  ) => {
    const { hideZeroBalanceTokens } = preferences;
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

    const allAssets: TokenWithFiatAmount[] = [];
    assetIds.forEach((assetId: CaipAssetId) => {
      const { chainId, assetNamespace } = parseCaipAssetType(assetId);
      const isNative = assetNamespace === 'slip44';
      const balance = balances?.[assetId] || { amount: '0', unit: '' };
      const rate = assetRates?.[assetId]?.rate;

      const balanceInFiat = rate
        ? new BigNumber(balance.amount).times(rate).toNumber()
        : null;

      const assetMetadataFallback = {
        name: balance.unit,
        symbol: balance.unit || '',
        fungible: true,
        units: [{ name: assetId, symbol: balance.unit || '', decimals: 0 }],
      };

      const metadata = assetsMetadata[assetId] || assetMetadataFallback;
      const decimals = metadata.units[0]?.decimals || 0;
      if (!hideZeroBalanceTokens || balance.amount !== '0' || isNative) {
        allAssets.push({
          title: metadata.name,
          address: assetId,
          symbol: metadata.symbol,
          image: metadata.iconUrl,
          decimals,
          chainId,
          isNative,
          balance: balance.amount,
          secondary: balanceInFiat,
          string: '',
          tokenFiatAmount: balanceInFiat,
          isStakeable: false,
        });
      }
    });

    return allAssets;
  },
);

/**
 * Gets a {@link Token} (EVM or Multichain) owned by the passed account by address and chainId.
 *
 * @deprecated use getAllAssets instead
 * @param state - Redux state object
 * @param tokenAddress - Token address (Hex for EVM, or CaipAssetType for non-EVM)
 * @param chainId - Chain ID (Hex for EVM, or CaipChainId for non-EVM)
 * @param internalAccount - The account holding the token to search for
 * @returns Token object
 */
export const getTokenByAccountAndAddressAndChainId =
  createParameterizedSelector(100)(
    (state) => state,
    (_state, account: InternalAccount | undefined) => account,
    (
      _state,
      _account: InternalAccount | undefined,
      tokenAddress: Hex | CaipAssetType | string | undefined,
    ) => tokenAddress,
    (
      _state,
      _account: InternalAccount | undefined,
      _tokenAddress: Hex | CaipAssetType | string | undefined,
      _chainId: Hex | CaipChainId,
    ) => _chainId,
    (
      state,
      account: InternalAccount | undefined,
      tokenAddress: Hex | CaipAssetType | string | undefined,
      chainId: Hex | CaipChainId,
    ) => {
      const isEvm = isEvmChainId(chainId);
      if (!tokenAddress && !isEvm) {
        return null;
      }

      const accountToUse =
        account ??
        (isEvm
          ? getSelectedInternalAccount(state)
          : getInternalAccountBySelectedAccountGroupAndCaip(
              state,
              chainId as CaipChainId,
            ));

      if (!accountToUse) {
        return null;
      }

      const assetsToSearch = isEvm
        ? (getSelectedAccountTokensAcrossChains(state) as Record<
            Hex,
            TokenWithFiatAmount[]
          >)
        : (groupBy(
            getMultiChainAssets(state, accountToUse),
            'chainId',
          ) as Record<CaipChainId, TokenWithFiatAmount[]>);

      const result = findAssetByAddress(assetsToSearch, tokenAddress, chainId);

      return result;
    },
  );

const zeroBalanceAssetFallback = { amount: 0, unit: '' };

/**
 * @deprecated use selectBalanceByAccountGroup instead
 */
export const getMultichainAggregatedBalance = createSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getMultiChainAssetsControllerAccountsAssets,
  getMultichainAssetsRatesControllerConversionRates,
  (selectedAccountAddress, multichainBalances, accountAssets, assetRates) => {
    const { id } = selectedAccountAddress ?? {};
    const assetIds = id ? accountAssets?.[id] || [] : [];
    const balances = id ? multichainBalances?.[id] : {};

    let aggregatedBalance = new BigNumber(0);

    assetIds.forEach((assetId: CaipAssetId) => {
      const balance = balances?.[assetId] || zeroBalanceAssetFallback;
      const rate = assetRates?.[assetId]?.rate || '0';
      const balanceInFiat = new BigNumber(balance.amount).times(rate);

      aggregatedBalance = aggregatedBalance.plus(balanceInFiat);
    });

    return aggregatedBalance.toNumber();
  },
);

export const getHistoricalMultichainAggregatedBalance = createDeepEqualSelector(
  (_state, selectedAccount: { id: string }) => selectedAccount,
  getMultichainBalances,
  getMultiChainAssetsControllerAccountsAssets,
  getMultichainAssetsRatesControllerConversionRates,
  (
    selectedAccountAddress: { id: string },
    multichainBalances: Record<
      string,
      Record<string, { amount: string; unit: string }>
    >,
    accountAssets: Record<string, string[]>,
    assetRates: ReturnType<
      typeof getMultichainAssetsRatesControllerConversionRates
    >,
  ) => {
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

    // Initialize historical balances object with zeros
    const historicalBalances = {
      PT1H: { balance: 0, percentChange: 0, amountChange: 0 },
      P1D: { balance: 0, percentChange: 0, amountChange: 0 },
      P7D: { balance: 0, percentChange: 0, amountChange: 0 },
      P14D: { balance: 0, percentChange: 0, amountChange: 0 },
      P30D: { balance: 0, percentChange: 0, amountChange: 0 },
      P200D: { balance: 0, percentChange: 0, amountChange: 0 },
      P1Y: { balance: 0, percentChange: 0, amountChange: 0 },
    };
    type HistoricalBalances = typeof historicalBalances;

    // Track total current balance for calculating overall percent changes
    let totalCurrentBalance = new BigNumber(0);

    assetIds.forEach((assetId: string) => {
      const balance = balances?.[assetId] || zeroBalanceAssetFallback;
      const assetRate = assetRates?.[assetId as keyof typeof assetRates];

      if (!assetRate?.marketData?.pricePercentChange) {
        return;
      }

      if (assetRate.rate) {
        const { pricePercentChange } = assetRate.marketData;
        // Calculate current balance in fiat
        const currentBalanceInFiat = new BigNumber(balance.amount).times(
          assetRate.rate || '0',
        );

        // Add to total current balance
        totalCurrentBalance = totalCurrentBalance.plus(currentBalanceInFiat);

        // For each time period, reconstruct the historical balance for that period, based on current balance and percent change
        Object.entries(pricePercentChange).forEach(
          ([period, percentChange]) => {
            if (period in historicalBalances) {
              // Calculate historical balance by adjusting current balance by the percent change
              const historicalBalance = currentBalanceInFiat
                .div(Number((1 + (percentChange as number) / 100).toFixed(8)))
                .toNumber();

              // aggregated the historical balance for that period with the running balance from the other balance
              historicalBalances[period as keyof HistoricalBalances].balance +=
                historicalBalance;
            }
          },
        );
      }
    });

    // Calculate overall percent and amount change for each historical period
    const totalCurrentBalanceNum = totalCurrentBalance.toNumber();

    Object.entries(historicalBalances).forEach(([_period, data]) => {
      if (totalCurrentBalanceNum !== 0) {
        // Calculate amount change (current - historical)
        const amountChange = totalCurrentBalanceNum - data.balance;

        // Calculate percent change relative to historical balance
        const percentChange = (amountChange / data.balance) * 100;

        // Round to 8 decimal places for precision
        data.amountChange = Number(amountChange.toFixed(8));
        data.percentChange = Number(percentChange.toFixed(8));
      }
    });

    return historicalBalances;
  },
);

/**
 * Gets the CAIP asset type of the native token of the current network.
 *
 * @param state - Redux state object
 * @param selectedAccount - Selected account
 * @returns CAIP asset type of the native token, or undefined if no native token is found
 */
export const getMultichainNativeAssetType = createSelector(
  getSelectedInternalAccount,
  getMultiChainAssetsControllerAccountsAssets,
  getSelectedMultichainNetworkConfiguration,
  (selectedAccount, accountAssets, currentNetwork) => {
    const assetTypes = accountAssets?.[selectedAccount.id] || [];
    const nativeAssetType = assetTypes.find((assetType) => {
      const { chainId, assetNamespace } = parseCaipAssetType(assetType);
      return chainId === currentNetwork.chainId && assetNamespace === 'slip44';
    });

    return nativeAssetType;
  },
);

/**
 * Gets the balance of the native token of the current network for the selected account.
 *
 * @deprecated use selectBalanceByAccountGroup instead
 * @param state - Redux state object
 * @param selectedAccount - Selected account
 * @returns Balance of the native token, or fallbacks to { amount: 0, unit: '' } if no native token is found
 */
export const getMultichainNativeTokenBalance = createSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getMultichainNativeAssetType,
  (selectedAccountAddress, multichainBalances, nativeAssetType) => {
    if (!selectedAccountAddress) {
      return zeroBalanceAssetFallback;
    }

    const balances = multichainBalances?.[selectedAccountAddress.id];

    if (!nativeAssetType || !balances?.[nativeAssetType]) {
      return zeroBalanceAssetFallback;
    }

    return balances[nativeAssetType];
  },
);

// Aggregated balance selectors using core pure function
/**
 * Returns the `metamask` slice with a safe empty fallback.
 *
 * @param state - Redux state used by balance selectors.
 * @returns The `metamask` slice or an empty object.
 */
const getMetamaskState = (state: BalanceCalculationState) =>
  state.metamask ?? EMPTY_OBJECT;

const defaultAccountTreeState = getDefaultAccountTreeControllerState();

// Renamed for clarity
/**
 * Derives the minimal Account Tree payload needed by core balance functions.
 * Provides stable empty fallbacks for memoization resilience.
 *
 * @param state
 */
const selectAccountTreeStateForBalances = createSelector(
  [
    (state: BalanceCalculationState) => getMetamaskState(state).accountTree,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).selectedAccountGroup,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).isAccountTreeSyncingInProgress,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).hasAccountTreeSyncingSyncedAtLeastOnce,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).accountGroupsMetadata,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).accountWalletsMetadata,
  ],
  (
    accountTree,
    selectedAccountGroup,
    isAccountTreeSyncingInProgress,
    hasAccountTreeSyncingSyncedAtLeastOnce,
    accountGroupsMetadata,
    accountWalletsMetadata,
  ): AccountTreeControllerState => ({
    accountTree: accountTree ?? defaultAccountTreeState.accountTree,
    selectedAccountGroup:
      selectedAccountGroup ?? defaultAccountTreeState.selectedAccountGroup,
    isAccountTreeSyncingInProgress:
      isAccountTreeSyncingInProgress ??
      defaultAccountTreeState.isAccountTreeSyncingInProgress,
    hasAccountTreeSyncingSyncedAtLeastOnce:
      hasAccountTreeSyncingSyncedAtLeastOnce ??
      defaultAccountTreeState.hasAccountTreeSyncingSyncedAtLeastOnce,
    accountGroupsMetadata:
      accountGroupsMetadata ?? defaultAccountTreeState.accountGroupsMetadata,
    accountWalletsMetadata:
      accountWalletsMetadata ?? defaultAccountTreeState.accountWalletsMetadata,
  }),
);

/**
 * Picks internal accounts with defaults in the shape expected by core.
 *
 * @param state
 */
const selectAccountsStateForBalances = createSelector(
  [
    (state: BalanceCalculationState) =>
      getMetamaskState(state).internalAccounts,
    (state: BalanceCalculationState) => getAccountIdByAddress(state),
  ],
  (internalAccounts, accountIdByAddress) => ({
    internalAccounts: internalAccounts ?? { accounts: {}, selectedAccount: '' },
    accountIdByAddress: accountIdByAddress ?? {},
  }),
);

const ARC_USDC_ERC20_ADDRESS = ARC_USDC_TOKEN_ADDRESS.toLowerCase();

/**
 * Wraps token balances for core balance computations.
 */
const selectTokenBalancesStateForBalances = createSelector(
  [getTokenBalances],
  (tokenBalances) => {
    // Strip the Arc USDC ERC20 (0x3600…) so it is excluded from the aggregated
    // balance — the native token already reflects the USDC balance on Arc and
    // is the source of truth, so counting both would double the balance.
    const result = Object.fromEntries(
      Object.entries(tokenBalances).map(([account, chainMap]) => [
        account,
        Object.fromEntries(
          Object.entries(chainMap).map(([chainId, addressMap]) => [
            chainId,
            chainId === CHAIN_IDS.ARC
              ? Object.fromEntries(
                  Object.entries(addressMap).filter(
                    ([address]) =>
                      address.toLowerCase() !== ARC_USDC_ERC20_ADDRESS,
                  ),
                )
              : addressMap,
          ]),
        ),
      ]),
    ) as typeof tokenBalances;
    return { tokenBalances: result };
  },
);

/**
 * Exposes market data (rates) for core balance computations.
 */
const selectTokenRatesStateForBalances = createSelector(
  [getMarketData],
  (marketData) => ({
    marketData,
  }),
);

/**
 * Provides conversion rates and historical prices with stable fallbacks.
 */
const selectMultichainRatesStateForBalances = createSelector(
  [getMultichainAssetsRatesControllerConversionRates],
  (conversionRates) => ({
    conversionRates: conversionRates ?? EMPTY_OBJECT,
    historicalPrices: EMPTY_OBJECT,
  }),
);

/**
 * Wraps multichain balances for core balance computations.
 */
const selectMultichainBalancesStateForBalances = createSelector(
  [getMultichainBalances],
  (balances) => ({ balances }),
);

/**
 * Wraps multichain assets for core balance computations.
 */
const selectMultichainAssetsStateForBalances = createSelector(
  [
    getMultiChainAssetsControllerAccountsAssets,
    getMultiChainAssetsControllerAssetsMetadata,
    getMultiChainAssetsControllerAllIgnoredAssets,
  ],
  (accountsAssets, assetsMetadata, allIgnoredAssets) => ({
    accountsAssets,
    assetsMetadata,
    allIgnoredAssets,
  }),
);

/**
 * Normalizes tokens state and supplies explicit empty maps for optional pieces.
 *
 * @param state - Redux state providing `metamask.allTokens`.
 */
const selectTokensStateForBalances = createSelector(
  [getTokensControllerAllTokens],
  (allTokens) => ({
    allTokens: allTokens ?? EMPTY_OBJECT,
    allIgnoredTokens: EMPTY_OBJECT,
    allDetectedTokens: EMPTY_OBJECT,
  }),
);

/**
 * Exposes current user currency and currency rates with safe defaults.
 */
const selectCurrencyRateStateForBalances = createSelector(
  [getCurrentCurrency, getCurrencyRates],
  (currentCurrency, currencyRates) => ({
    currentCurrency: currentCurrency ?? 'usd',
    currencyRates: currencyRates ?? EMPTY_OBJECT,
  }),
);

/**
 * Reconstruct AssetsController from flattened state
 */
const selectAssetsControllerStateForBalances = createSelector(
  [
    getAssetsInfo,
    getAssetsBalance,
    getAssetsPrice,
    getAssetPreferences,
    getCustomAssets,
    getSelectedCurrency,
  ],
  (
    assetsInfo,
    assetsBalance,
    assetsPrice,
    assetPreferences,
    customAssets,
    selectedCurrency,
  ): AssetsControllerState => ({
    assetsInfo,
    assetsBalance,
    assetsPrice,
    assetPreferences,
    customAssets,
    selectedCurrency,
  }),
);

/**
 * Aggregates balances for all wallets and groups.
 *
 * When the assets-unify-state feature is enabled the totals are sourced from
 * the new `getAggregatedBalanceForAccount` selector (the all-wallets scenario
 * is polyfilled by aggregating each group individually). Otherwise the legacy
 * `calculateBalanceForAllWallets` core helper is used.
 *
 * @param state - Redux state from which the required slices are derived.
 * @returns Aggregated balances structure for all wallets and groups.
 */
export const selectBalanceForAllWallets = createSelector(
  [
    getIsAssetsUnifyStateEnabled,
    selectAssetsControllerStateForBalances,
    getInternalAccountsObject,
    selectAccountTreeStateForBalances,
    selectAccountsStateForBalances,
    selectTokenBalancesStateForBalances,
    selectTokenRatesStateForBalances,
    selectMultichainRatesStateForBalances,
    selectMultichainBalancesStateForBalances,
    selectMultichainAssetsStateForBalances,
    selectTokensStateForBalances,
    selectCurrencyRateStateForBalances,
    getEnabledNetworks,
    getNetworkConfigurationsByChainId,
  ],
  (
    isAssetsUnifyStateEnabled,
    assetsControllerState,
    accountsById,
    accountTreeState,
    accountsState,
    tokenBalancesState,
    tokenRatesState,
    multichainRatesState,
    multichainBalancesState,
    multichainAssetsState,
    tokensState,
    currencyRateState,
    enabledNetworkMap,
    networkConfigurationsByChainId,
  ) => {
    if (isAssetsUnifyStateEnabled) {
      return calculateBalanceForAllWalletsFromUnified(
        augmentAssetControllersState(assetsControllerState),
        accountTreeState,
        accountsById,
        enabledNetworkMap,
      );
    }
    return calculateBalanceForAllWallets(
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      multichainAssetsState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
      networkConfigurationsByChainId ?? {},
    );
  },
);

/**
 * Computes balance change for the currently selected account group.
 * Returns null when no group is selected.
 *
 * @param period - Balance change period.
 */
export const selectBalanceChangeBySelectedAccountGroup = (
  period: BalanceChangePeriod,
) =>
  createSelector(
    [
      getIsAssetsUnifyStateEnabled,
      selectAssetsControllerStateForBalances,
      getInternalAccountsObject,
      selectAccountTreeStateForBalances,
      selectAccountsStateForBalances,
      selectTokenBalancesStateForBalances,
      selectTokenRatesStateForBalances,
      selectMultichainRatesStateForBalances,
      selectMultichainBalancesStateForBalances,
      selectMultichainAssetsStateForBalances,
      selectTokensStateForBalances,
      selectCurrencyRateStateForBalances,
      getEnabledNetworks,
    ],
    (
      isAssetsUnifyStateEnabled,
      assetsControllerState,
      accountsById,
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      multichainAssetsState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
    ): BalanceChangeResult | null => {
      const groupId = accountTreeState?.selectedAccountGroup;
      if (!groupId) {
        return null;
      }
      if (isAssetsUnifyStateEnabled) {
        return calculateBalanceChangeForAccountGroupFromUnified(
          augmentAssetControllersState(assetsControllerState),
          accountTreeState,
          accountsById,
          enabledNetworkMap,
          groupId,
          period,
        );
      }
      return calculateBalanceChangeForAccountGroup(
        accountTreeState,
        accountsState,
        tokenBalancesState,
        tokenRatesState,
        multichainRatesState,
        multichainBalancesState,
        multichainAssetsState,
        tokensState,
        currencyRateState,
        enabledNetworkMap,
        groupId,
        period,
      );
    },
  );

/**
 * Creates an enabledNetworkMap from all non-test networks for balance calculations.
 * This selector combines EVM and non-EVM mainnet networks (excluding testnets and custom testnets)
 * and formats them into the enabledNetworkMap structure expected by calculateBalanceForAllWallets.
 *
 * @param state - Redux state containing network configurations.
 * @returns EnabledNetworkMap with all non-test networks enabled across all namespaces.
 */
const selectAllMainnetNetworksEnabledMap = createSelector(
  [getNonTestNetworks],
  (nonTestNetworks) => {
    const enabledNetworkMap: Record<string, Record<string, boolean>> = {};

    nonTestNetworks.forEach((network) => {
      const { caipChainId } = network;
      const { namespace, reference } = parseCaipChainId(caipChainId);

      if (!enabledNetworkMap[namespace]) {
        enabledNetworkMap[namespace] = {};
      }

      // Fix: Convert reference to proper format for calculateBalanceForAllWallets
      if (namespace === KnownCaipNamespace.Eip155) {
        // For EVM chains, use hex format (e.g., "1" → "0x1")
        const chainIdHex = toHex(reference);
        enabledNetworkMap[namespace][chainIdHex] = true;
      } else {
        // For non-EVM chains, use full CAIP chainId as key
        enabledNetworkMap[namespace][caipChainId] = true;
      }
    });

    return enabledNetworkMap;
  },
);

/**
 * Safely extracts a balance value from an object with a fallback default.
 * Uses @metamask/utils hasProperty for robust property checking.
 *
 * @param obj - The object to extract the balance from
 * @param prop - The property name containing the balance
 * @param defaultValue - The default value to return if extraction fails
 * @returns The balance value or the default value
 */
function getBalanceOrDefault(
  obj: unknown,
  prop: string,
  defaultValue: string,
): string {
  return isObject(obj) &&
    hasProperty(obj, prop) &&
    typeof obj[prop] === 'string'
    ? (obj[prop] as string)
    : defaultValue;
}

/**
 * Determines whether the selected account group has any tokens (native or non-native).
 * This determines whether to show the balance UI or the "Fund Your Wallet" empty state.
 *
 * Checks for:
 * - Native token balances (ETH, MATIC, SOL, BTC, etc.)
 * - Non-native token balances (ERC-20, SPL tokens, etc.)
 *
 * Without tokens, users cannot transact, so we show the empty state to prompt funding.
 *
 * @param state - Redux state containing account tree, balances, and assets.
 * @returns true if the account group has any non-zero token balances, false otherwise.
 */
export const selectAccountGroupBalanceForEmptyState = createSelector(
  [
    selectAccountTreeStateForBalances,
    selectAccountsStateForBalances,
    selectTokenBalancesStateForBalances,
    selectMultichainBalancesStateForBalances,
    selectAllMainnetNetworksEnabledMap,
    getAccountTrackerControllerAccountsByChainId,
  ],
  (
    accountTreeState,
    accountsState,
    tokenBalancesState,
    multichainBalancesState,
    allMainnetNetworksMap,
    accountsByChainId,
  ): boolean => {
    const selectedGroupId = accountTreeState?.selectedAccountGroup;
    if (!selectedGroupId) {
      return false;
    }

    // Get accounts in the selected group from accountTreeState
    const accountTree = accountTreeState?.accountTree;
    if (!accountTree?.wallets) {
      return false;
    }

    // Find the group in the account tree to get account IDs
    let groupAccountIds: string[] = [];
    for (const treeWallet of Object.values(accountTree.wallets)) {
      if (treeWallet.groups[selectedGroupId]) {
        groupAccountIds = treeWallet.groups[selectedGroupId].accounts || [];
        break;
      }
    }

    if (groupAccountIds.length === 0) {
      return false;
    }

    // Create a set for faster lookups
    const groupAccountIdsSet = new Set(groupAccountIds);
    const groupAddresses = new Set<string>();

    // Extract addresses from accountsState for accounts in this group
    Object.entries(accountsState.internalAccounts?.accounts || {}).forEach(
      ([accountId, account]) => {
        if (groupAccountIdsSet.has(accountId) && account?.address) {
          groupAddresses.add(account.address.toLowerCase());
        }
      },
    );

    // Get mainnet EVM and non-EVM chain IDs for filtering
    const mainnetEvmChainIds = new Set(
      Object.keys(allMainnetNetworksMap?.eip155 || {}),
    );
    const mainnetNonEvmChainIds = new Set(
      Object.keys(allMainnetNetworksMap?.solana || {}).concat(
        Object.keys(allMainnetNetworksMap?.bip122 || {}),
      ),
    );

    // Check EVM native token balances from accountsByChainId (only for accounts in this group and mainnet chains)
    const hasEvmBalance = Object.entries(accountsByChainId || {}).some(
      ([chainId, chainAccounts]) => {
        // Only check mainnet chains
        if (!mainnetEvmChainIds.has(chainId)) {
          return false;
        }
        if (!isObject(chainAccounts)) {
          return false;
        }
        return Object.entries(chainAccounts).some(([address, account]) => {
          // Only check accounts that belong to the selected group
          if (!groupAddresses.has(address.toLowerCase())) {
            return false;
          }
          if (!isObject(account)) {
            return false;
          }
          const balanceValue = getBalanceOrDefault(account, 'balance', '0x0');
          // Use isEmptyHexString to properly handle all hex zero formats (0x0, 0x, etc.)
          return !isEmptyHexString(balanceValue);
        });
      },
    );

    // Check multichain balances for any non-zero non-EVM native token balances (only for accounts in this group and mainnet chains)
    const hasNonEvmBalance = Object.entries(
      multichainBalancesState?.balances || {},
    ).some(([accountId, accountBalances]) => {
      // Only check accounts that belong to the selected group
      if (!groupAccountIdsSet.has(accountId)) {
        return false;
      }
      if (!isObject(accountBalances)) {
        return false;
      }
      return Object.entries(accountBalances).some(([assetId, balanceData]) => {
        // Extract chainId from the asset ID (format: "chainId/assetType")
        const chainId = assetId.split('/')[0];
        // Only check mainnet chains
        if (!mainnetNonEvmChainIds.has(chainId)) {
          return false;
        }
        if (!isObject(balanceData)) {
          return false;
        }
        const balanceValue = getBalanceOrDefault(balanceData, 'amount', '0');
        // Use isZeroAmount to properly handle decimal zeros like "0.0", "0.00", etc.
        return !isZeroAmount(balanceValue);
      });
    });

    // Check ERC-20 token balances (only for accounts in this group and mainnet chains)
    const hasErc20Tokens = Object.entries(
      tokenBalancesState?.tokenBalances || {},
    ).some(([address, accountTokenBalances]) => {
      // Only check accounts that belong to the selected group
      if (!groupAddresses.has(address.toLowerCase())) {
        return false;
      }
      if (!isObject(accountTokenBalances)) {
        return false;
      }
      // Check all chains for this account
      return Object.entries(accountTokenBalances).some(
        ([chainId, chainBalances]) => {
          // Only check mainnet chains
          if (!mainnetEvmChainIds.has(chainId)) {
            return false;
          }
          if (!isObject(chainBalances)) {
            return false;
          }
          // Check all tokens on this chain
          return Object.values(chainBalances).some((balance) => {
            if (typeof balance !== 'string') {
              return false;
            }
            // Use isEmptyHexString to check if token balance is non-zero (0x0, 0x, etc.)
            return !isEmptyHexString(balance);
          });
        },
      );
    });

    return hasEvmBalance || hasNonEvmBalance || hasErc20Tokens;
  },
);

/**
 * Determines whether balance data has loaded for the selected account group.
 * A missing balance record means the wallet can still be hydrating, so the UI
 * should avoid showing the zero-balance empty state until a zero is confirmed.
 *
 * @param state - Redux state containing account tree, accounts, and balances.
 * @returns true if the account group has at least one mainnet balance record.
 */
export const selectAccountGroupBalanceIsLoadedForEmptyState = createSelector(
  [
    selectAccountTreeStateForBalances,
    selectAccountsStateForBalances,
    selectMultichainBalancesStateForBalances,
    selectAllMainnetNetworksEnabledMap,
    getAccountTrackerControllerAccountsByChainId,
  ],
  (
    accountTreeState,
    accountsState,
    multichainBalancesState,
    allMainnetNetworksMap,
    accountsByChainId,
  ): boolean => {
    const selectedGroupId = accountTreeState?.selectedAccountGroup;
    if (!selectedGroupId) {
      return false;
    }

    const accountTree = accountTreeState?.accountTree;
    if (!accountTree?.wallets) {
      return false;
    }

    let groupAccountIds: string[] = [];
    for (const treeWallet of Object.values(accountTree.wallets)) {
      if (treeWallet.groups[selectedGroupId]) {
        groupAccountIds = treeWallet.groups[selectedGroupId].accounts || [];
        break;
      }
    }

    if (groupAccountIds.length === 0) {
      return false;
    }

    const groupAccountIdsSet = new Set(groupAccountIds);
    const groupEvmAddresses = new Set<string>();
    const groupNonEvmAccountIds = new Set<string>();

    Object.entries(accountsState.internalAccounts?.accounts || {}).forEach(
      ([accountId, account]) => {
        if (!groupAccountIdsSet.has(accountId)) {
          return;
        }

        if (isEvmAccountType(account.type) && account.address) {
          groupEvmAddresses.add(account.address.toLowerCase());
          return;
        }

        groupNonEvmAccountIds.add(accountId);
      },
    );

    const mainnetEvmChainIds = new Set(
      Object.keys(allMainnetNetworksMap?.eip155 || {}),
    );
    const mainnetNonEvmChainIds = new Set(
      Object.keys(allMainnetNetworksMap?.solana || {}).concat(
        Object.keys(allMainnetNetworksMap?.bip122 || {}),
      ),
    );

    const hasLoadedEvmBalance = Object.entries(accountsByChainId || {}).some(
      ([chainId, chainAccounts]) => {
        if (!mainnetEvmChainIds.has(chainId) || !isObject(chainAccounts)) {
          return false;
        }

        return Object.keys(chainAccounts).some((address) =>
          groupEvmAddresses.has(address.toLowerCase()),
        );
      },
    );

    const hasLoadedNonEvmBalance = Object.entries(
      multichainBalancesState?.balances || {},
    ).some(([accountId, accountBalances]) => {
      if (!groupNonEvmAccountIds.has(accountId) || !isObject(accountBalances)) {
        return false;
      }

      return Object.keys(accountBalances).some((assetId) => {
        const chainId = assetId.split('/')[0];
        return mainnetNonEvmChainIds.has(chainId);
      });
    });

    return hasLoadedEvmBalance || hasLoadedNonEvmBalance;
  },
);

/**
 * Selects the selected account group's balance entry from the aggregated
 * balances output, returning a minimal fallback when not present.
 *
 * @param state - Redux state used to read selection and aggregated balances.
 */
export const selectBalanceBySelectedAccountGroup = createSelector(
  [selectAccountTreeStateForBalances, selectBalanceForAllWallets],
  (accountTreeState, allBalances) => {
    const selectedGroupId = accountTreeState?.selectedAccountGroup;
    if (!selectedGroupId) {
      return null;
    }
    const walletId = selectedGroupId.split('/')[0];
    const wallet = allBalances.wallets[walletId] ?? null;
    const { userCurrency } = allBalances;
    if (!wallet?.groups[selectedGroupId]) {
      return {
        walletId,
        groupId: selectedGroupId,
        totalBalanceInUserCurrency: 0,
        userCurrency,
      };
    }
    return wallet.groups[selectedGroupId];
  },
);

export const selectBalanceByAccountGroup = (groupId: string) =>
  createSelector([selectBalanceForAllWallets], (allBalances) => {
    const walletId = groupId.split('/')[0];
    const wallet = allBalances.wallets[walletId] ?? null;
    const { userCurrency } = allBalances;
    if (!wallet?.groups[groupId]) {
      return {
        walletId,
        groupId,
        totalBalanceInUserCurrency: 0,
        userCurrency,
      };
    }
    return wallet.groups[groupId];
  });

/**
 * Returns a summary for a wallet's balance and its groups, with zeroed fallback
 * when the wallet entry does not exist in the aggregated output.
 *
 * @param walletId - Wallet identifier.
 */
export const selectBalanceByWallet = (walletId: string) =>
  createSelector([selectBalanceForAllWallets], (allBalances) => {
    const wallet = allBalances.wallets[walletId] ?? null;
    const { userCurrency } = allBalances;

    if (!wallet) {
      return {
        walletId,
        totalBalanceInUserCurrency: 0,
        userCurrency,
        groups: {},
      };
    }

    return {
      walletId,
      totalBalanceInUserCurrency: wallet.totalBalanceInUserCurrency,
      userCurrency,
      groups: wallet.groups,
    };
  });

const getStateForAssetSelector = createSelector(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- There is no type for the root state
  (state: any) => state.metamask,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- There is no type for the root state
  (metamask: any) => {
    const initialState = {
      selectedAccountGroup: metamask.selectedAccountGroup,
      accountTree: metamask.accountTree,
      internalAccounts: metamask.internalAccounts,
      allTokens: getTokensControllerAllTokens({ metamask }),
      allIgnoredTokens: getTokensControllerAllIgnoredTokens({ metamask }),
      tokenBalances: getTokenBalancesControllerTokenBalances({ metamask }),
      marketData: getTokenRatesControllerMarketData({ metamask }),
      currencyRates: getCurrencyRateControllerCurrencyRates({ metamask }),
      currentCurrency: getCurrencyRateControllerCurrentCurrency({ metamask }),
      networkConfigurationsByChainId: metamask.networkConfigurationsByChainId,
      accountsByChainId: getAccountTrackerControllerAccountsByChainId({
        metamask,
      }),
    };

    const multichainState = {
      accountsAssets: getMultiChainAssetsControllerAccountsAssets({ metamask }),
      assetsMetadata: getMultiChainAssetsControllerAssetsMetadata({ metamask }),
      allIgnoredAssets: getMultiChainAssetsControllerAllIgnoredAssets({
        metamask,
      }),
      balances: getMultiChainBalancesControllerBalances({ metamask }),
      conversionRates: getMultichainAssetsRatesControllerConversionRates({
        metamask,
      }),
    };

    return {
      ...initialState,
      ...multichainState,
    } as AssetListState;
  },
);

/**
 * Removes the Arc USDC ERC20 (0x3600…) from the per-chain asset map so it never
 * appears as a duplicate of the native token on Arc. The native token (zero
 * address) is kept, as it is the source of truth for USDC on Arc.
 *
 * @param assets - Per-chain map of assets keyed by chain ID.
 * @returns The asset map with the Arc USDC ERC20 removed from the Arc entry.
 */
function filterArcUsdcErc20Token(
  assets: AccountGroupAssets,
): AccountGroupAssets {
  const arcAssets = assets[CHAIN_IDS.ARC];
  if (!arcAssets) {
    return assets;
  }
  return {
    ...assets,
    [CHAIN_IDS.ARC]: arcAssets.filter(
      (asset) =>
        !('address' in asset) ||
        asset.address?.toLowerCase() !== ARC_USDC_ERC20_ADDRESS,
    ),
  };
}

export const getAssetsBySelectedAccountGroup = createSelector(
  getStateForAssetSelector,
  (assetListState: AssetListState) =>
    filterArcUsdcErc20Token(selectAssetsBySelectedAccountGroup(assetListState)),
);

export const getAssetsBySelectedAccountGroupIncludingHidden =
  createDeepEqualSelector(
    getStateForAssetSelector,
    (assetListState: AssetListState) =>
      filterArcUsdcErc20Token(
        selectAssetsBySelectedAccountGroup({
          ...assetListState,
          allIgnoredTokens: EMPTY_OBJECT,
          allIgnoredAssets: EMPTY_OBJECT,
        }),
      ),
  );

export const selectAccountSupportsEnabledNetworks = createSelector(
  [getSelectedInternalAccount, getAllEnabledNetworksForAllNamespaces],
  (selectedAccount, enabledNetworks) => {
    if (!selectedAccount || enabledNetworks.length === 0) {
      return true;
    }

    if (isEvmAccountType(selectedAccount.type)) {
      return enabledNetworks.some((chainId) =>
        isEvmChainId(chainId as Hex | CaipChainId),
      );
    }

    const accountScopes = selectedAccount.scopes || [];
    return enabledNetworks.some((chainId) =>
      accountScopes.includes(chainId as CaipChainId),
    );
  },
);

export const getAssetsBySelectedAccountGroupWithTronSpecialAssets =
  createSelector(getStateForAssetSelector, (assetListState: AssetListState) =>
    selectAssetsBySelectedAccountGroup(assetListState, {
      filterTronStakedTokens: false,
    }),
  );

export const getAsset = createSelector(
  [
    getAssetsBySelectedAccountGroup,
    (_, assetId: string, _chainId: Hex | CaipChainId) => assetId,
    (_, _assetId: string, chainId: Hex | CaipChainId) => chainId,
  ],
  (assetsBySelectedAccountGroup, assetId, chainId) => {
    const chainAssets = assetsBySelectedAccountGroup[chainId];

    return chainAssets?.find((item) => item.assetId === assetId);
  },
);

const getChainIdsForAssetRouteLookup = (
  chainId: Hex | CaipChainId | undefined,
  assetId: CaipAssetType,
): (Hex | CaipChainId)[] => {
  if (!isCaipAssetType(assetId)) {
    return chainId ? [chainId] : [];
  }

  try {
    const { chainId: caipChainId, chain } = parseCaipAssetType(assetId);
    const hexChainId = toHex(chain.reference) as Hex;

    return [
      ...new Set(
        [chainId, caipChainId, hexChainId].filter(
          (id): id is Hex | CaipChainId => id !== undefined,
        ),
      ),
    ];
  } catch {
    return chainId ? [chainId] : [];
  }
};

type RouteAssetMatchItem = {
  assetId?: string;
  address?: string;
  chainId?: string;
  isNative?: boolean;
};

const assetIdsMatch = (
  itemAssetId: string | undefined,
  routeAssetId: CaipAssetType,
): boolean => {
  if (!itemAssetId) {
    return false;
  }

  if (itemAssetId === routeAssetId) {
    return true;
  }

  if (itemAssetId.toLowerCase() === routeAssetId.toLowerCase()) {
    return true;
  }

  if (!isCaipAssetType(itemAssetId)) {
    return false;
  }

  try {
    const itemParsed = parseCaipAssetType(itemAssetId);
    const routeParsed = parseCaipAssetType(routeAssetId);

    return (
      itemParsed.chainId === routeParsed.chainId &&
      itemParsed.assetNamespace === routeParsed.assetNamespace &&
      itemParsed.assetReference.toLowerCase() ===
        routeParsed.assetReference.toLowerCase()
    );
  } catch {
    return false;
  }
};

const itemMatchesRouteAsset = (
  item: RouteAssetMatchItem,
  routeAssetId: CaipAssetType,
  decodedAsset?: string,
): boolean => {
  if (assetIdsMatch(item.assetId, routeAssetId)) {
    return true;
  }

  if (
    decodedAsset &&
    item.address?.toLowerCase() === decodedAsset.toLowerCase()
  ) {
    return true;
  }

  if (
    decodedAsset &&
    item.assetId &&
    !isCaipAssetType(item.assetId) &&
    item.assetId.toLowerCase() === decodedAsset.toLowerCase()
  ) {
    return true;
  }

  if (item.address && item.chainId) {
    const itemRouteAssetId = toAssetId(
      item.address,
      item.chainId as Hex | CaipChainId,
    );
    if (itemRouteAssetId && assetIdsMatch(itemRouteAssetId, routeAssetId)) {
      return true;
    }
  }

  return false;
};

const getEvmHexChainIdForLookup = (
  chainId: Hex | CaipChainId | undefined,
  assetId?: CaipAssetType,
): Hex | CaipChainId | undefined => {
  if (!chainId) {
    return undefined;
  }

  if (isStrictHexString(chainId)) {
    return chainId;
  }

  if (assetId && isCaipAssetType(assetId)) {
    try {
      const { chain } = parseCaipAssetType(assetId);
      return toHex(chain.reference) as Hex;
    } catch {
      return chainId;
    }
  }

  if (isEvmChainId(chainId)) {
    try {
      const { reference } = parseCaipChainId(chainId as CaipChainId);
      return toHex(reference) as Hex;
    } catch {
      return chainId;
    }
  }

  return chainId;
};

/**
 * Resolves a fungible asset from a CAIP-19 asset route for the asset details page.
 * @param state
 * @param options0
 * @param options0.assetId
 * @param options0.chainId
 * @param options0.decodedAsset
 */
export const getFungibleAssetForRoute = (
  state: Parameters<typeof getAssetsBySelectedAccountGroup>[0],
  {
    assetId,
    chainId,
    decodedAsset,
  }: Pick<ResolvedAssetRoute, 'assetId' | 'chainId' | 'decodedAsset'>,
): TokenWithFiatAmount | Token | null | undefined => {
  if (assetId && isCaipAssetType(assetId)) {
    try {
      const assetsByGroup = getAssetsBySelectedAccountGroup(state);
      const chainIdsToTry = getChainIdsForAssetRouteLookup(chainId, assetId);
      const { assetNamespace } = parseCaipAssetType(assetId);

      for (const id of chainIdsToTry) {
        const match = assetsByGroup[id as string]?.find((item) =>
          itemMatchesRouteAsset(item, assetId, decodedAsset),
        );
        if (match) {
          return match as unknown as TokenWithFiatAmount;
        }
      }

      if (assetNamespace === 'slip44') {
        for (const id of chainIdsToTry) {
          const nativeAsset = assetsByGroup[id as string]?.find(
            (item) => item.isNative,
          );
          if (nativeAsset) {
            return nativeAsset as unknown as TokenWithFiatAmount;
          }
        }
      }

      const flatMatch = Object.values(assetsByGroup)
        .flat()
        .find((item) => itemMatchesRouteAsset(item, assetId, decodedAsset));

      if (flatMatch) {
        return flatMatch as unknown as TokenWithFiatAmount;
      }

      // Native assets may be keyed by zero address while the route uses slip44.
      if (assetNamespace === 'slip44') {
        const nativeFlatMatch = Object.values(assetsByGroup)
          .flat()
          .find(
            (item) =>
              item.isNative &&
              chainIdsToTry.includes(item.chainId as Hex | CaipChainId),
          );

        if (nativeFlatMatch) {
          return nativeFlatMatch as unknown as TokenWithFiatAmount;
        }
      }
    } catch {
      // Fall through to legacy lookup below.
    }
  }

  if (!chainId) {
    return null;
  }

  return getTokenByAccountAndAddressAndChainId(
    state,
    undefined,
    decodedAsset,
    getEvmHexChainIdForLookup(chainId, assetId) ?? chainId,
  );
};

export const selectSingleTokenByAddressAndChainId = createSelector(
  getAllTokens,
  (_state, tokenAddress: Hex) => tokenAddress,
  (_state, _tokenAddress: Hex, chainId: Hex) => chainId,
  (allTokens, tokenAddress, chainId) => {
    const chainTokens = Object.values(
      allTokens[chainId] ?? {},
    ).flat() as Token[];

    return chainTokens.find(
      (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
    );
  },
);
