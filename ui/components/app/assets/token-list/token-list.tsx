import React, { ReactNode, useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
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
  getSelectedAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountTokensAcrossChains,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { calculateTokenBalance } from '../util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../util/calculateTokenFiatAmount';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  nativeToken?: ReactNode;
};

export type Token = {
  address: Hex;
  aggregators: string[];
  chainId: Hex;
  decimals: number;
  isNative: boolean;
  symbol: string;
  image: string;
};

export type TokenWithFiatAmount = Token & {
  tokenFiatAmount: number | null;
  balance?: string;
  string: string; // needed for backwards compatability TODO: fix this
};

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

export default function TokenList({ onTokenClick }: TokenListProps) {
  const t = useI18nContext();
  const currentNetwork = useSelector(getCurrentNetwork);
  const selectedAccount = useSelector(getSelectedAccount);

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

  const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates);
  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  const consolidatedBalances = () => {
    const tokensWithBalance: TokenWithFiatAmount[] = [];

    Object.entries(selectedAccountTokensChains).forEach(
      ([stringChainKey, tokens]) => {
        const chainId = stringChainKey as Hex;
        tokens.forEach((token: Token) => {
          const { isNative, address, decimals } = token;
          const balance =
            calculateTokenBalance({
              isNative,
              chainId,
              address,
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

          // Append processed token with balance and fiat amount
          tokensWithBalance.push({
            ...token,
            balance,
            tokenFiatAmount,
            chainId,
            string: String(balance),
          });
        });
      },
    );

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

    const { nativeTokens, nonNativeTokens } = filteredAssets.reduce<{
      nativeTokens: TokenWithFiatAmount[];
      nonNativeTokens: TokenWithFiatAmount[];
    }>(
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
    selectedAccount,
    selectedAccountTokensChains,
  ]);

  console.log({ sortedFilteredTokens });

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
          chainId={tokenData.chainId}
          address={tokenData.address}
          symbol={tokenData.symbol}
          tokenFiatAmount={tokenData.tokenFiatAmount}
          image={tokenData?.image}
          isNative={tokenData.isNative}
          string={tokenData.string}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
