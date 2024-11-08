import React, { ReactNode, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import BN from 'bn.js';
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
  getCurrentNetwork,
  getMarketData,
  getPreferences,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountTokensAcrossChains,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { stringifyBalance } from '../../../../hooks/useTokenBalances';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken?: ReactNode;
};

export default function TokenList({ onTokenClick }: TokenListProps) {
  const t = useI18nContext();
  const currentNetwork = useSelector(getCurrentNetwork);
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
          let balance;

          const hexBalance =
            selectedAccountTokenBalancesAcrossChains[chainId]?.[address];

          if (hexBalance !== '0x0') {
            const decimalBalance = hexToDecimal(hexBalance);
            const readableBalance = stringifyBalance(
              new BN(decimalBalance),
              new BN(token.decimals),
            );
            balance = readableBalance || 0;
          }

          const baseCurrency = marketData[chainId]?.[address]?.currency;

          const tokenMarketPrice = marketData[chainId]?.[address]?.price;
          const tokenExchangeRate = currencyRates[baseCurrency]?.conversionRate;

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          let tokenFiatAmount = tokenMarketPrice * tokenExchangeRate * balance;
          if (token.isNative && currencyRates) {
            tokenFiatAmount =
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              currencyRates[token.symbol]?.conversionRate * balance;
          }

          tokensWithBalance.push({
            ...token,
            balance,
            tokenFiatAmount,
            chainId,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            string: balance.toString(),
          });
        },
      );
    });

    return tokensWithBalance;
  };

  const sortedFilteredTokens = useMemo(() => {
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
    const assets = [...nativeTokens, ...nonNativeTokens];
    return sortAssets(assets, tokenSortConfig);
  }, [
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
    currentNetwork,
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
      {sortedFilteredTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.chainId}-${tokenData.symbol}-${tokenData.address}`}
          {...tokenData}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
