import {
  MultichainAssetsControllerState,
  MultichainAssetsRatesControllerState,
} from '@metamask/assets-controllers';
import { BigNumber } from 'bignumber.js';
import { CaipAssetId } from '@metamask/keyring-api';
import {
  CaipAssetType,
  CaipChainId,
  Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { getTokenBalances } from '../ducks/metamask/metamask';
import { TEST_CHAINS } from '../../shared/constants/network';
import { Token, TokenWithFiatAmount } from '../components/app/assets/types';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../components/app/assets/util/calculateTokenFiatAmount';
import {
  getCurrencyRates,
  getCurrentNetwork,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNativeTokenCachedBalanceByChainIdSelector,
  getPreferences,
  getTokensAcrossChainsByAccountAddressSelector,
} from './selectors';
import { getMultichainBalances, getMultichainNetwork } from './multichain';

export type AssetsState = {
  metamask: MultichainAssetsControllerState;
};

export type AssetsRatesState = {
  metamask: MultichainAssetsRatesControllerState;
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
            tokensWithBalance.push({
              ...token,
              address: token.address as CaipAssetType,
              balance,
              tokenFiatAmount,
              chainId: chainId as CaipChainId,
              string: String(balance),
              primary: '',
              secondary: 0,
              title: '',
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
      const rate = assetRates?.[assetId]?.rate || '0';
      const balanceInFiat = new BigNumber(balance.amount).times(rate);

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
          secondary: balanceInFiat.toNumber(),
          string: '',
          tokenFiatAmount: balanceInFiat.toNumber(), // for now we are keeping this is to satisfy sort, this should be fiat amount
          isStakeable: false,
        });
      }
    });

    return allAssets;
  },
);

const zeroBalanceAssetFallback = { amount: 0, unit: '' };

export const getMultichainAggregatedBalance = createDeepEqualSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainNetwork,
  getMultichainBalances,
  getAccountAssets,
  getAssetsRates,
  (
    selectedAccountAddress,
    currentNetwork,
    multichainBalances,
    accountAssets,
    assetRates,
  ) => {
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

    let aggregatedBalance = new BigNumber(0);

    assetIds.forEach((assetId: CaipAssetId) => {
      const { chainId } = parseCaipAssetType(assetId);
      if (chainId === currentNetwork.chainId) {
        const balance = balances?.[assetId] || zeroBalanceAssetFallback;
        const rate = assetRates?.[assetId]?.rate || '0';
        const balanceInFiat = new BigNumber(balance.amount).times(rate);

        aggregatedBalance = aggregatedBalance.plus(balanceInFiat);
      }
    });

    return aggregatedBalance.toNumber();
  },
);

export const getMultichainNativeTokenBalance = createDeepEqualSelector(
  (_state, selectedAccount) => selectedAccount,
  getMultichainNetwork,
  getMultichainBalances,
  getAccountAssets,
  (
    selectedAccountAddress,
    currentNetwork,
    multichainBalances,
    accountAssets,
  ) => {
    const assetIds = accountAssets?.[selectedAccountAddress.id] || [];
    const balances = multichainBalances?.[selectedAccountAddress.id];

    let nativeTokenBalance = zeroBalanceAssetFallback;

    assetIds.forEach((assetId: CaipAssetId) => {
      const { chainId, assetNamespace } = parseCaipAssetType(assetId);
      if (chainId === currentNetwork.chainId && assetNamespace === 'slip44') {
        const balance = balances?.[assetId] || zeroBalanceAssetFallback;

        nativeTokenBalance = balance;
      }
    });

    return nativeTokenBalance;
  },
);
