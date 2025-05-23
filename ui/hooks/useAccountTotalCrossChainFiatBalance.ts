import { shallowEqual, useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import {
  getCurrentCurrency,
  getCurrencyRates,
} from '../ducks/metamask/metamask';
import {
  getCrossChainTokenExchangeRates,
  getCrossChainMetaMaskCachedBalances,
} from '../selectors';
import {
  getValueFromWeiHex,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { TokenWithBalance } from '../components/app/assets/types';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../shared/constants/network';

type AddressBalances = {
  [address: string]: number;
};

export type Balances = {
  [id: string]: AddressBalances;
};

export type FormattedTokensWithBalances = {
  chainId: string;
  tokensWithBalances: TokenWithBalance[];
};

export const useAccountTotalCrossChainFiatBalance = (
  account: { address: string },
  formattedTokensWithBalancesPerChain: FormattedTokensWithBalances[],
) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const currencyRates = useSelector(getCurrencyRates);
  const currentCurrency = useSelector(getCurrentCurrency);

  const crossChainContractRates = useSelector(
    getCrossChainTokenExchangeRates,
    shallowEqual,
  );
  const crossChainCachedBalances: Balances = useSelector(
    getCrossChainMetaMaskCachedBalances,
  );
  const mergedCrossChainRates: Balances = useMemo(
    () => ({
      ...crossChainContractRates, // todo add confirmation exchange rates?
    }),
    [crossChainContractRates],
  );

  const tokenFiatBalancesCrossChains = useMemo(
    () =>
      formattedTokensWithBalancesPerChain.map((singleChainTokenBalances) => {
        const { tokensWithBalances } = singleChainTokenBalances;
        // Attempt to use known currency symbols in map
        // Otherwise fallback to user defined currency
        const matchedChainSymbol =
          CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
            singleChainTokenBalances.chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
          ] ??
          allNetworks[singleChainTokenBalances.chainId as `0x${string}`]
            .nativeCurrency;
        const conversionRate =
          currencyRates?.[matchedChainSymbol]?.conversionRate;
        const tokenFiatBalances = tokensWithBalances.map((token) => {
          const tokenExchangeRate =
            mergedCrossChainRates?.[singleChainTokenBalances.chainId]?.[
              toChecksumAddress(token.address)
            ];
          const totalFiatValue = getTokenFiatAmount(
            tokenExchangeRate,
            conversionRate,
            currentCurrency,
            token.string,
            token.symbol,
            false,
            false,
          );

          return totalFiatValue;
        });

        const balanceCached =
          crossChainCachedBalances?.[singleChainTokenBalances.chainId]?.[
            account?.address
          ] ?? 0;
        const nativeFiatValue = getValueFromWeiHex({
          value: balanceCached,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 2,
        });
        return {
          ...singleChainTokenBalances,
          tokenFiatBalances,
          nativeFiatValue,
        };
      }),
    [
      formattedTokensWithBalancesPerChain,
      allNetworks,
      currencyRates,
      mergedCrossChainRates,
      crossChainCachedBalances,
      account?.address,
      currentCurrency,
    ],
  );

  const finalTotal = useMemo(
    () =>
      tokenFiatBalancesCrossChains.reduce((accumulator, currentValue) => {
        const tmpCurrentValueFiatBalances: string[] =
          currentValue.tokenFiatBalances.filter(
            (value): value is string => value !== undefined,
          );
        const totalFiatBalance = sumDecimals(
          currentValue.nativeFiatValue,
          ...tmpCurrentValueFiatBalances,
        );

        const totalAsNumber = totalFiatBalance.toNumber
          ? totalFiatBalance.toNumber()
          : Number(totalFiatBalance);

        return accumulator + totalAsNumber;
      }, 0),
    [tokenFiatBalancesCrossChains],
  );

  return {
    totalFiatBalance: finalTotal.toString(10),
    tokenFiatBalancesCrossChains,
  };
};
