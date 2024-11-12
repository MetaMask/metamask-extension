import { shallowEqual, useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import {
  getCurrentCurrency,
  getNetworkConfigurationsByChainId,
  getCrossChainTokenExchangeRates,
  getCrossChainMetaMaskCachedBalances,
} from '../selectors';
import {
  getValueFromWeiHex,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import {
  getConversionRate,
  getCurrencyRates,
} from '../ducks/metamask/metamask';
import { getTokenFiatAmount } from '../helpers/utils/token-util';

export const useAccountTotalCrossChainFiatBalance = (
  account,
  dataTokensWithBalancesCrossChain,
) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const currencyRates = useSelector(getCurrencyRates);

  const conversionRate = useSelector(getConversionRate);
  const currentCurrency = useSelector(getCurrentCurrency);

  const crossChainContractRates = useSelector(
    getCrossChainTokenExchangeRates,
    shallowEqual,
  );

  const crossChainCachedBalances = useSelector(
    getCrossChainMetaMaskCachedBalances,
  );

  // const loading = false; //todo check if loading is still needed

  const mergedCrossChainRates = {
    ...crossChainContractRates, // todo add confirmation exchange rates?
  };

  const tokenFiatBalancesCrossChains = dataTokensWithBalancesCrossChain.map(
    (singleChainTokenBalances) => {
      const { tokensWithBalances } = singleChainTokenBalances;
      const tokenFiatBalances = tokensWithBalances.map((token) => {
        const tokenExchangeRate =
          mergedCrossChainRates[singleChainTokenBalances.chainId][
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
      // todo make sure this is returning the correct value, compare with tickers
      const matchedChainSymbol =
        allNetworks[singleChainTokenBalances.chainId].nativeCurrency;
      const matchedConversionRate =
        currencyRates?.[matchedChainSymbol]?.conversionRate;
      const balanceCached =
        crossChainCachedBalances?.[singleChainTokenBalances.chainId]?.[
          account?.address
        ] ?? 0;
      const nativeFiatValue = getValueFromWeiHex({
        value: balanceCached,
        toCurrency: currentCurrency,
        conversionRate: matchedConversionRate,
        numberOfDecimals: 2,
      });
      return {
        ...singleChainTokenBalances,
        tokenFiatBalances,
        nativeFiatValue,
      };
    },
  );

  const finalTotal = tokenFiatBalancesCrossChains.reduce(
    (accumulator, currentValue) => {
      const totalFiatBalance = sumDecimals(
        currentValue.nativeFiatValue,
        ...currentValue.tokenFiatBalances,
      );
      // todo clean this
      const totalAsNumber = totalFiatBalance.toNumber
        ? totalFiatBalance.toNumber()
        : Number(totalFiatBalance);

      return accumulator + totalAsNumber;
    },
    0,
  );

  return {
    totalFiatBalance: finalTotal.toString(10),
    tokenFiatBalancesCrossChains,
  };
};
