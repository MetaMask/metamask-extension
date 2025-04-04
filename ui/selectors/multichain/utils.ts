import {
  type ChainBalance,
  type AccountBalance,
  type CurrencyRates,
  type MarketData,
  type TokenBalances,
} from './types';
import { type Hex, type CaipChainId } from '@metamask/utils';
import { toHex, hexToBN } from '@metamask/controller-utils';
import { Token } from '@metamask/assets-controllers';
import { NetworkConfiguration } from '@metamask/network-controller';
import { calculateTokenBalance } from '../../components/app/assets/util/calculateTokenBalance';
import { getValueFromWeiHex } from '../../../shared/modules/conversion.utils';

export const calculateChainBalance = (
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
