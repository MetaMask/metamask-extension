import React, { ReactNode, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import TokenCell from '../token-cell';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { sortAssets } from '../util/sort';
import {
  getCurrencyRates,
  getMarketData,
  getPreferences,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountTokensAcrossChains,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken?: ReactNode;
};

export default function TokenList({ onTokenClick }: TokenListProps) {
  const t = useI18nContext();
  const { tokenSortConfig, tokenNetworkFilter } = useSelector(getPreferences);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const selectedAccountTokensChains: Record<string, any> = useSelector(
    getSelectedAccountTokensAcrossChains,
  );

  const selectedAccountTokenBalancesAcrossChains: Record<string, any> =
    useSelector(getSelectedAccountTokenBalancesAcrossChains);

  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);

  const consolidatedBalances = () => {
    const tokensWithBalance: any[] = [];

    Object.keys(selectedAccountTokensChains).forEach((chainId: string) => {
      selectedAccountTokensChains[chainId].forEach(
        (token: Record<string, any>) => {
          const { address } = token;
          const balance =
            selectedAccountTokenBalancesAcrossChains[chainId]?.[address];

          const baseCurrency = marketData[chainId]?.[address]?.currency;

          const tokenMarketPrice = marketData[chainId]?.[address]?.price || '0';
          const tokenExchangeRate =
            currencyRates[baseCurrency]?.conversionRate || '0';

          let tokenFiatAmount = tokenMarketPrice * tokenExchangeRate * balance;
          if (token.isNative && currencyRates) {
            tokenFiatAmount =
              currencyRates[token.symbol].conversionRate * balance;
          }

          tokensWithBalance.push({
            ...token,
            balance,
            tokenFiatAmount,
            chainId,
            string: balance.toString(),
          });
        },
      );
    });

    return tokensWithBalance;
  };

  const sortedTokens = useMemo(() => {
    const consolidatedTokensWithBalances = consolidatedBalances();
    const filteredAssets = filterAssets(consolidatedTokensWithBalances, [
      {
        key: 'chainId',
        opts: tokenNetworkFilter,
        filterCallback: 'inclusive',
      },
    ]);

    const { nativeTokens, nonNativeTokens } = filteredAssets.reduce(
      (acc, token) => {
        if (token.isNative) {
          acc.nativeTokens.push(token);
        } else {
          acc.nonNativeTokens.push(token);
        }
        return acc;
      },
      { nativeTokens: [], nonNativeTokens: [] },
    );
    return sortAssets([...nativeTokens, ...nonNativeTokens], tokenSortConfig);
  }, [
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
  ]);

  const loading = false;
  return loading ? (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={7}
      data-testid="token-list-loading-message"
    >
      {t('loadingTokens')}
    </Box>
  ) : (
    <div>
      {sortedTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.symbol}-${tokenData.address}`}
          {...tokenData}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
