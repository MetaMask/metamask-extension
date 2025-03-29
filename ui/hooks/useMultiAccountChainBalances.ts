// Third party dependencies
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';
import { Token } from '@metamask/assets-controllers';
import { toHex, hexToBN } from '@metamask/controller-utils';
import type { Hex, CaipChainId } from '@metamask/utils';
import { NetworkConfiguration } from '@metamask/network-controller';

// External dependencies
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  getAllTokens,
  getMarketData,
  selectAccountsByChainId,
} from '../selectors/selectors';
import {
  getTokenBalances,
  getCurrencyRates,
  getCurrentCurrency,
} from '../ducks/metamask/metamask';
import { calculateTokenBalance } from '../components/app/assets/util/calculateTokenBalance';
import { getValueFromWeiHex } from '../../shared/modules/conversion.utils';

type ChainBalance = {
  chainId: string;
  totalNativeFiatBalance: number;
  totalImportedTokenFiatBalance: number;
  totalFiatBalance: number;
};

type ChainFiatBalances = {
  [address: string]: ChainBalance[];
};

type AccountBalance = {
  address: string;
  balance: string;
  stakedBalance?: string;
};

type CurrencyRateEntry = {
  conversionRate: number;
  usdConversionRate?: number;
};

type CurrencyRates = {
  [currency: string]: CurrencyRateEntry;
};

type TokenMarketData = {
  price: number;
  contractPercentChange1d?: number;
  priceChange1d?: number;
  marketCap?: number;
  totalVolume?: number;
  circulatingSupply?: number;
};

type ChainMarketData = {
  [tokenAddress: string]: TokenMarketData;
};

type MarketData = {
  [chainId: string]: ChainMarketData;
};

type TokenBalances = {
  [chainId: string]: Record<Hex, Hex>;
};

const calculateChainBalance = (
  chainId: string,
  accountAddress: string,
  accountsByChainId: Record<string, Record<string, AccountBalance>>,
  allNetworks: Record<Hex | CaipChainId, NetworkConfiguration>,
  currencyRates: CurrencyRates,
  currentCurrency: string,
  allTokens: Record<Hex, Record<string, Token[]>>,
  marketData: MarketData,
  tokenBalances: TokenBalances,
): ChainBalance => {
  const chainBalance: ChainBalance = {
    chainId,
    totalNativeFiatBalance: 0,
    totalImportedTokenFiatBalance: 0,
    totalFiatBalance: 0,
  };

  const matchedChainSymbol = allNetworks[chainId as Hex]?.nativeCurrency;
  const conversionRate =
    currencyRates?.[matchedChainSymbol]?.conversionRate ?? 0;

  // Calculate native token balance
  if (accountsByChainId[chainId]) {
    const balanceBN = hexToBN(
      accountsByChainId[chainId][accountAddress]?.balance || '0x00',
    );

    const stakedBalanceBN = hexToBN(
      accountsByChainId[chainId][accountAddress]?.stakedBalance || '0x00',
    );

    const totalAccountBalance = balanceBN.add(stakedBalanceBN).toString('hex');

    const nativeFiatValue = Number(
      getValueFromWeiHex({
        value: totalAccountBalance,
        fromCurrency: matchedChainSymbol,
        toCurrency: currentCurrency,
        conversionRate,
        numberOfDecimals: 2,
      }),
    );

    chainBalance.totalNativeFiatBalance = nativeFiatValue;
  }

  // Calculate imported token balances
  const tokens = allTokens?.[chainId as Hex]?.[accountAddress] ?? [];
  const tokenExchangeRates = marketData?.[toHex(chainId)];

  for (const token of tokens) {
    const { address, decimals } = token;
    const exchangeRate = tokenExchangeRates?.[token.address]?.price;

    const balance =
      calculateTokenBalance({
        isNative: false,
        chainId: chainId as Hex,
        address: address as Hex,
        decimals,
        nativeBalances: {},
        selectedAccountTokenBalancesAcrossChains: tokenBalances,
      }) || '0';

    const base = Math.pow(10, 5);
    const balanceNum = parseFloat(balance);
    const parsedAmount = parseFloat(
      String(
        Math.floor(balanceNum * conversionRate * exchangeRate * base) / base,
      ),
    );

    chainBalance.totalImportedTokenFiatBalance += isNaN(parsedAmount)
      ? 0
      : parsedAmount;
  }

  chainBalance.totalFiatBalance =
    chainBalance.totalNativeFiatBalance +
    chainBalance.totalImportedTokenFiatBalance;

  return chainBalance;
};

/**
 * Selector to get the multi-account chain balances
 *
 * @param allTokenBalances - The token balances for all accounts
 * @param allTokens - The tokens for all accounts
 * @param allNetworks - The networks for all accounts
 * @param accountsByChainId - The accounts by chain id
 * @param marketData - The market data for all accounts
 * @param currencyRates - The currency rates for all accounts
 * @param currentCurrency - The current currency for all accounts
 * @returns The multi-account chain balances for all accounts for each chain
 */
export const getMultiAccountChainBalances = createSelector(
  [
    getTokenBalances,
    getAllTokens,
    getNetworkConfigurationsByChainId,
    selectAccountsByChainId,
    getMarketData,
    getCurrencyRates,
    getCurrentCurrency,
  ],
  (
    allTokenBalances,
    allTokens,
    allNetworks,
    accountsByChainId,
    marketData,
    currencyRates,
    currentCurrency,
  ): ChainFiatBalances => {
    const result: ChainFiatBalances = {};

    // Early return if no token balances
    if (!allTokenBalances || Object.keys(allTokenBalances).length === 0) {
      return result;
    }

    for (const [accountAddress, tokenBalances] of Object.entries(
      allTokenBalances,
    )) {
      result[accountAddress] = [];

      for (const [chainId] of Object.entries(tokenBalances)) {
        const chainBalance = calculateChainBalance(
          chainId,
          accountAddress,
          accountsByChainId,
          allNetworks,
          currencyRates,
          currentCurrency,
          allTokens,
          marketData,
          tokenBalances,
        );

        result[accountAddress].push(chainBalance);
      }
    }

    return result;
  },
);

// Hook wrapper for components that need it
export const useMultiAccountChainBalances = (): ChainFiatBalances => {
  return useSelector(getMultiAccountChainBalances);
};
