import {
  AssetListState,
  DeFiPositionsControllerState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  calculateBalanceChangeForAllWallets,
  calculateBalanceForAllWallets,
  calculateBalanceChangeForAccountGroup,
  selectAssetsBySelectedAccountGroup,
} from '@metamask/assets-controllers';
import { CaipAssetId } from '@metamask/keyring-api';
import {
  CaipAssetType,
  CaipChainId,
  Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { groupBy } from 'lodash';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { createSelector } from 'reselect';
import type { AccountTreeControllerState } from '@metamask/account-tree-controller';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type {
  TokenBalancesControllerState,
  TokenRatesControllerState,
  MultichainBalancesControllerState,
  TokensControllerState,
  CurrencyRateState,
  BalanceChangePeriod,
  BalanceChangeResult,
} from '@metamask/assets-controllers';
import { TEST_CHAINS } from '../../shared/constants/network';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { Token, TokenWithFiatAmount } from '../components/app/assets/types';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../components/app/assets/util/calculateTokenFiatAmount';
import {
  getTokenBalances,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
import { findAssetByAddress } from '../pages/asset/util';
import { isEvmChainId } from '../../shared/lib/asset-utils';
import { getSelectedInternalAccount } from './accounts';
import { getMultichainBalances } from './multichain';
import {
  getCurrencyRates,
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNativeTokenCachedBalanceByChainIdSelector,
  getPreferences,
  getSelectedAccountTokensAcrossChains,
  getTokensAcrossChainsByAccountAddressSelector,
  getEnabledNetworks,
} from './selectors';
import { getSelectedMultichainNetworkConfiguration } from './multichain/networks';
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
  metamask: Partial<AccountTreeControllerState> &
    Partial<AccountsControllerState> &
    Partial<TokenBalancesControllerState> &
    Partial<TokenRatesControllerState> &
    Partial<MultichainBalancesControllerState> &
    Partial<TokensControllerState> &
    Partial<CurrencyRateState> & {
      conversionRates?: Record<string, unknown>;
      historicalPrices?: Record<string, unknown>;
    };
};

/**
 * Gets non-EVM accounts assets.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export function getAccountAssets(state: AssetsState) {
  return state.metamask.accountsAssets;
}

/**
 * Gets non-EVM assets metadata.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets metadata per asset types (CAIP-19).
 */
export function getAssetsMetadata(state: AssetsState) {
  return state.metamask.assetsMetadata;
}

/**
 * Gets non-EVM accounts assets rates.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets per accounts.
 */
export function getAssetsRates(state: AssetsRatesState) {
  return state.metamask.conversionRates;
}

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
 * Gets non-EVM assets historical prices.
 *
 * @param state - Redux state object.
 * @returns An object containing non-EVM assets historical prices per asset types (CAIP-19).
 */
export function getHistoricalPrices(state: AssetsRatesState) {
  return state.metamask.historicalPrices;
}

export const getTokenBalancesEvm = createDeepEqualSelector(
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              title = token.name || token.symbol;
            }

            tokensWithBalance.push({
              ...token,
              address: token.address as CaipAssetType,
              balance,
              tokenFiatAmount,
              chainId: chainId as CaipChainId,
              string: String(balance),
              primary: '',
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

export const getMultiChainAssets = createDeepEqualSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getAccountAssets,
  getAssetsMetadata,
  getAssetsRates,
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
          primary: balance.amount,
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
 * @param state - Redux state object
 * @param tokenAddress - Token address (Hex for EVM, or CaipAssetType for non-EVM)
 * @param chainId - Chain ID (Hex for EVM, or CaipChainId for non-EVM)
 * @param internalAccount - The account holding the token to search for
 * @returns Token object
 */
export const getTokenByAccountAndAddressAndChainId = createDeepEqualSelector(
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

    const assetsToSearch = isEvm
      ? (getSelectedAccountTokensAcrossChains(state) as Record<
          Hex,
          TokenWithFiatAmount[]
        >)
      : (groupBy(getMultiChainAssets(state, accountToUse), 'chainId') as Record<
          CaipChainId,
          TokenWithFiatAmount[]
        >);

    const result = findAssetByAddress(assetsToSearch, tokenAddress, chainId);

    return result;
  },
);

const zeroBalanceAssetFallback = { amount: 0, unit: '' };

export const getMultichainAggregatedBalance = createDeepEqualSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getAccountAssets,
  getAssetsRates,
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

export type HistoricalBalanceData = {
  balance: number;
  percentChange: number;
  amountChange: number;
};

export type HistoricalBalances = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  PT1H: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P1D: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P7D: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P14D: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P30D: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P200D: HistoricalBalanceData;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  P1Y: HistoricalBalanceData;
};

export const getHistoricalMultichainAggregatedBalance = createDeepEqualSelector(
  (_state, selectedAccount: { id: string }) => selectedAccount,
  getMultichainBalances,
  getAccountAssets,
  getAssetsRates,
  (
    selectedAccountAddress: { id: string },
    multichainBalances: Record<
      string,
      Record<string, { amount: string; unit: string }>
    >,
    accountAssets: Record<string, string[]>,
    assetRates: ReturnType<typeof getAssetsRates>,
  ) => {
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

    // Initialize historical balances object with zeros
    const historicalBalances: HistoricalBalances = {
      PT1H: { balance: 0, percentChange: 0, amountChange: 0 },
      P1D: { balance: 0, percentChange: 0, amountChange: 0 },
      P7D: { balance: 0, percentChange: 0, amountChange: 0 },
      P14D: { balance: 0, percentChange: 0, amountChange: 0 },
      P30D: { balance: 0, percentChange: 0, amountChange: 0 },
      P200D: { balance: 0, percentChange: 0, amountChange: 0 },
      P1Y: { balance: 0, percentChange: 0, amountChange: 0 },
    };

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
export const getMultichainNativeAssetType = createDeepEqualSelector(
  getSelectedInternalAccount,
  getAccountAssets,
  getSelectedMultichainNetworkConfiguration,
  (
    selectedAccount: ReturnType<typeof getSelectedInternalAccount>,
    accountAssets: ReturnType<typeof getAccountAssets>,
    currentNetwork: ReturnType<
      typeof getSelectedMultichainNetworkConfiguration
    >,
  ) => {
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
 * @param state - Redux state object
 * @param selectedAccount - Selected account
 * @returns Balance of the native token, or fallbacks to { amount: 0, unit: '' } if no native token is found
 */
export const getMultichainNativeTokenBalance = createDeepEqualSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainBalances,
  getMultichainNativeAssetType,
  (
    selectedAccountAddress,
    multichainBalances: ReturnType<typeof getMultichainBalances>,
    nativeAssetType: ReturnType<typeof getMultichainNativeAssetType>,
  ) => {
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
  state.metamask ?? {};

const EMPTY_OBJ = Object.freeze({});
const EMPTY_ACCOUNT_TREE = Object.freeze({
  wallets: {},
  selectedAccountGroup: '',
});

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
      getMetamaskState(state).accountGroupsMetadata,

    (state: BalanceCalculationState) =>
      getMetamaskState(state).accountWalletsMetadata,
  ],
  (accountTree, accountGroupsMetadata, accountWalletsMetadata) => ({
    accountTree: accountTree ?? EMPTY_ACCOUNT_TREE,
    accountGroupsMetadata: accountGroupsMetadata ?? EMPTY_OBJ,
    accountWalletsMetadata: accountWalletsMetadata ?? EMPTY_OBJ,
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
  ],
  (internalAccounts) => ({
    internalAccounts: internalAccounts ?? { accounts: {}, selectedAccount: '' },
  }),
);

/**
 * Wraps token balances for core balance computations.
 */
const selectTokenBalancesStateForBalances = createSelector(
  [getTokenBalances],
  (tokenBalances) => ({ tokenBalances }),
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
  [getAssetsRates, getHistoricalPrices],
  (conversionRates, historicalPrices) => ({
    conversionRates: conversionRates ?? EMPTY_OBJ,
    historicalPrices: historicalPrices ?? EMPTY_OBJ,
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
 * Normalizes tokens state and supplies explicit empty maps for optional pieces.
 *
 * @param state - Redux state providing `metamask.allTokens`.
 */
const selectTokensStateForBalances = createSelector(
  [(state: BalanceCalculationState) => getMetamaskState(state).allTokens],
  (allTokens) => ({
    allTokens: allTokens ?? EMPTY_OBJ,
    allIgnoredTokens: EMPTY_OBJ,
    allDetectedTokens: EMPTY_OBJ,
  }),
);

/**
 * Exposes current user currency and currency rates with safe defaults.
 */
const selectCurrencyRateStateForBalances = createSelector(
  [getCurrentCurrency, getCurrencyRates],
  (currentCurrency, currencyRates) => ({
    currentCurrency: currentCurrency ?? 'usd',
    currencyRates: currencyRates ?? {},
  }),
);

/**
 * Returns the enabled network map as-is for filtering and eligibility checks.
 */
const selectEnabledNetworkMapForBalances = createSelector(
  [getEnabledNetworks],
  (map) => map,
);

/**
 * Aggregates balances for all wallets and groups using core pure function.
 * Only the minimal controller state is composed to keep this selector lean.
 *
 * @param state - Redux state from which the required slices are derived.
 * @returns Aggregated balances structure for all wallets and groups.
 */
export const selectBalanceForAllWallets = createSelector(
  [
    selectAccountTreeStateForBalances,
    selectAccountsStateForBalances,
    selectTokenBalancesStateForBalances,
    selectTokenRatesStateForBalances,
    selectMultichainRatesStateForBalances,
    selectMultichainBalancesStateForBalances,
    selectTokensStateForBalances,
    selectCurrencyRateStateForBalances,
    selectEnabledNetworkMapForBalances,
  ],
  (
    accountTreeState,
    accountsState,
    tokenBalancesState,
    tokenRatesState,
    multichainRatesState,
    multichainBalancesState,
    tokensState,
    currencyRateState,
    enabledNetworkMap,
  ) =>
    calculateBalanceForAllWallets(
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
    ),
);

// Balance change selectors (period: '1d' | '7d' | '30d')
/**
 * Factory returning a selector that computes balance change across all wallets
 * for the provided period.
 *
 * @param period - Balance change period.
 */
export const selectBalanceChangeForAllWallets = (period: BalanceChangePeriod) =>
  createSelector(
    [
      selectAccountTreeStateForBalances,
      selectAccountsStateForBalances,
      selectTokenBalancesStateForBalances,
      selectTokenRatesStateForBalances,
      selectMultichainRatesStateForBalances,
      selectMultichainBalancesStateForBalances,
      selectTokensStateForBalances,
      selectCurrencyRateStateForBalances,
      selectEnabledNetworkMapForBalances,
    ],
    (
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
    ): BalanceChangeResult =>
      calculateBalanceChangeForAllWallets(
        accountTreeState,
        accountsState,
        tokenBalancesState,
        tokenRatesState,
        multichainRatesState,
        multichainBalancesState,
        tokensState,
        currencyRateState,
        enabledNetworkMap,
        period,
      ),
  );

/**
 * Convenience factory returning only the percent change for the given period.
 *
 * @param period - Balance change period.
 */
// Removed percent-only selector for all wallets to match mobile API surface

// Per-account-group balance change selectors using core helper
/**
 * Factory returning a selector that computes balance change for a specific
 * account group and period.
 *
 * @param groupId - Account group identifier.
 * @param period - Balance change period.
 */
export const selectBalanceChangeByAccountGroup = (
  groupId: string,
  period: BalanceChangePeriod,
) =>
  createSelector(
    [
      selectAccountTreeStateForBalances,
      selectAccountsStateForBalances,
      selectTokenBalancesStateForBalances,
      selectTokenRatesStateForBalances,
      selectMultichainRatesStateForBalances,
      selectMultichainBalancesStateForBalances,
      selectTokensStateForBalances,
      selectCurrencyRateStateForBalances,
      selectEnabledNetworkMapForBalances,
    ],
    (
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
    ): BalanceChangeResult =>
      calculateBalanceChangeForAccountGroup(
        accountTreeState,
        accountsState,
        tokenBalancesState,
        tokenRatesState,
        multichainRatesState,
        multichainBalancesState,
        tokensState,
        currencyRateState,
        enabledNetworkMap,
        groupId,
        period,
      ),
  );

export const selectBalancePercentChangeByAccountGroup = (
  groupId: string,
  period: BalanceChangePeriod,
) =>
  createSelector(
    [selectBalanceChangeByAccountGroup(groupId, period)],
    (change) => change.percentChange,
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
      selectAccountTreeStateForBalances,
      selectAccountsStateForBalances,
      selectTokenBalancesStateForBalances,
      selectTokenRatesStateForBalances,
      selectMultichainRatesStateForBalances,
      selectMultichainBalancesStateForBalances,
      selectTokensStateForBalances,
      selectCurrencyRateStateForBalances,
      selectEnabledNetworkMapForBalances,
    ],
    (
      accountTreeState,
      accountsState,
      tokenBalancesState,
      tokenRatesState,
      multichainRatesState,
      multichainBalancesState,
      tokensState,
      currencyRateState,
      enabledNetworkMap,
    ): BalanceChangeResult | null => {
      const groupId = accountTreeState?.accountTree?.selectedAccountGroup;
      if (!groupId) {
        return null;
      }
      return calculateBalanceChangeForAccountGroup(
        accountTreeState,
        accountsState,
        tokenBalancesState,
        tokenRatesState,
        multichainRatesState,
        multichainBalancesState,
        tokensState,
        currencyRateState,
        enabledNetworkMap,
        groupId,
        period,
      );
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
    const selectedGroupId = accountTreeState?.accountTree?.selectedAccountGroup;
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

export const getAssetsBySelectedAccountGroup = createDeepEqualSelector(
  ({ metamask }) => {
    const initialState = {
      accountTree: metamask.accountTree,
      internalAccounts: metamask.internalAccounts,
      allTokens: metamask.allTokens,
      allIgnoredTokens: metamask.allIgnoredTokens,
      tokenBalances: metamask.tokenBalances,
      marketData: metamask.marketData,
      currencyRates: metamask.currencyRates,
      currentCurrency: metamask.currentCurrency,
      networkConfigurationsByChainId: metamask.networkConfigurationsByChainId,
      accountsByChainId: metamask.accountsByChainId,
    };

    let multichainState = {
      accountsAssets: {},
      assetsMetadata: {},
      balances: {},
      conversionRates: {},
    };

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    multichainState = {
      accountsAssets: metamask.accountsAssets,
      assetsMetadata: metamask.assetsMetadata,
      balances: metamask.balances,
      conversionRates: metamask.conversionRates,
    };
    ///: END:ONLY_INCLUDE_IF

    return {
      ...initialState,
      ...multichainState,
    };
  },
  (assetListState: AssetListState) =>
    selectAssetsBySelectedAccountGroup(assetListState),
);
