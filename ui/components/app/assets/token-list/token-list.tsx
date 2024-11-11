import React, { ReactNode, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import BN from 'bn.js';
import { Hex } from '@metamask/utils';
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
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountTokensAcrossChains,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { stringifyBalance } from '../../../../hooks/useTokenBalances';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  nativeToken?: ReactNode;
};

type Token = {
  address: Hex;
  aggregators: string[];
  chainId: Hex;
  decimals: number;
  isNative: boolean;
  symbol: string;
};

type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;

export default function TokenList({ onTokenClick }: TokenListProps) {
  const t = useI18nContext();
  const currentNetwork = useSelector(getCurrentNetwork);

  const { tokenSortConfig, tokenNetworkFilter } = useSelector(getPreferences);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const selectedAccountTokensChains: Record<Hex, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<Hex, Token[]>;

  const selectedAccountTokenBalancesAcrossChains: AddressBalanceMapping =
    useSelector(
      getSelectedAccountTokenBalancesAcrossChains,
    ) as AddressBalanceMapping;

  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);
  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const consolidatedBalances = () => {
    const tokensWithBalance: Token[] = [];

    Object.entries(selectedAccountTokensChains).forEach(([chainId, tokens]) => {
      console.log('chainId', chainId);
      tokens.forEach((token: Token) => {
        const { address, isNative, symbol, decimals } = token;
        let balance;

        if (isNative) {
          const nativeTokenBalanceHex = nativeBalances?.[chainId as Hex];
          if (nativeTokenBalanceHex && nativeTokenBalanceHex !== '0x0') {
            balance = stringifyBalance(
              new BN(hexToDecimal(nativeTokenBalanceHex)),
              new BN(decimals),
              5,
            );
          }
        } else {
          const hexBalance =
            selectedAccountTokenBalancesAcrossChains[chainId as Hex]?.[address];
          if (hexBalance && hexBalance !== '0x0') {
            balance = stringifyBalance(
              new BN(hexToDecimal(hexBalance)),
              new BN(decimals),
            );
          }
        }

        // Market and conversion rate data
        const baseCurrency = marketData[chainId]?.[address]?.currency;
        const tokenMarketPrice = marketData[chainId]?.[address]?.price || 0;
        const tokenExchangeRate =
          currencyRates[baseCurrency]?.conversionRate || 0;

        // Calculate fiat amount
        let tokenFiatAmount =
          tokenMarketPrice * tokenExchangeRate * parseFloat(String(balance));
        if (isNative && currencyRates) {
          tokenFiatAmount =
            currencyRates[symbol]?.conversionRate * parseFloat(String(balance));
        }

        // Append processed token with balance and fiat amount
        tokensWithBalance.push({
          ...token,
          balance,
          tokenFiatAmount,
          chainId,
          string: String(balance),
        });
      });
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
