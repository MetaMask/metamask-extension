import {
  DeFiPositionsControllerState,
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
  selectAllAssetsForSelectedAccountGroup,
  TokensControllerState,
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
import { AccountTreeControllerState } from '@metamask/account-tree-controller';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { TEST_CHAINS } from '../../shared/constants/network';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { Token, TokenWithFiatAmount } from '../components/app/assets/types';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../components/app/assets/util/calculateTokenFiatAmount';
import { getTokenBalances } from '../ducks/metamask/metamask';
import { findAssetByAddress } from '../pages/asset/util';
import { getSelectedInternalAccount } from './accounts';
import { getMultichainBalances, getMultichainIsEvm } from './multichain';
import {
  getCurrencyRates,
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNativeTokenCachedBalanceByChainIdSelector,
  getPreferences,
  getSelectedAccountTokensAcrossChains,
  getTokensAcrossChainsByAccountAddressSelector,
} from './selectors';
import { getSelectedMultichainNetworkConfiguration } from './multichain/networks';

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
};

export type DefiState = {
  metamask: DeFiPositionsControllerState;
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
  (_state, account?: InternalAccount) => account,
  (
    _state,
    _account?: InternalAccount,
    tokenAddress?: Hex | CaipAssetType | string,
  ) => tokenAddress,
  (
    _state,
    _account?: InternalAccount,
    _tokenAddress?: Hex | CaipAssetType | string,
    _chainId?: Hex | CaipChainId,
  ) => _chainId,
  (
    state,
    account?: InternalAccount,
    tokenAddress?: Hex | CaipAssetType | string,
    chainId?: Hex | CaipChainId,
  ) => {
    const accountToUse = account ?? getSelectedInternalAccount(state);
    const isEvm = getMultichainIsEvm(state, accountToUse);

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
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

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

// TODO: Review if this is the best way to use a controller level selector
export const getAllAssetsForSelectedAccountGroup = (state: {
  metamask: TokensControllerState &
    MultichainAssetsControllerState &
    AccountTreeControllerState &
    AccountsControllerState;
}) => selectAllAssetsForSelectedAccountGroup(state.metamask);
