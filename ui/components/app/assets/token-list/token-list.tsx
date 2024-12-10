import React, { ReactNode, useEffect, useMemo } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
import { sortAssets } from '../util/sort';
import {
  getCurrencyRates,
  getCurrentNetwork,
  getIsTestnet,
  getMarketData,
  getNetworkConfigurationIdByChainId,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokensAcrossChains,
  getShowFiatInTestnets,
  getTokenExchangeRates,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { calculateTokenBalance } from '../util/calculateTokenBalance';
import { calculateTokenFiatAmount } from '../util/calculateTokenFiatAmount';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances } from '../../../../hooks/useTokenBalances';
import { setTokenNetworkFilter } from '../../../../store/actions';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainShouldShowFiat } from '../../../../selectors/multichain';

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

const useFilteredAccountTokens = (currentNetwork: { chainId: string }) => {
  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(currentNetwork.chainId);
  }, [currentNetwork.chainId, TEST_CHAINS]);

  const selectedAccountTokensChains: Record<string, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<string, Token[]>;

  const filteredAccountTokensChains = useMemo(() => {
    return Object.fromEntries(
      Object.entries(selectedAccountTokensChains).filter(([chainId]) =>
        isTestNetwork
          ? (TEST_CHAINS as string[]).includes(chainId)
          : !(TEST_CHAINS as string[]).includes(chainId),
      ),
    );
  }, [selectedAccountTokensChains, isTestNetwork, TEST_CHAINS]);

  return filteredAccountTokensChains;
};

export default function TokenList({
  onTokenClick,
  nativeToken,
}: TokenListProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationIdByChainId);
  const {
    tokenSortConfig,
    tokenNetworkFilter,
    privacyMode,
    hideZeroBalanceTokens,
  } = useSelector(getPreferences);
  const preferences = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const newTokensImported = useSelector(getNewTokensImported);
  const selectedAccountTokensChains = useFilteredAccountTokens(currentNetwork);

  const { tokenBalances } = useTokenBalances();
  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address];

  const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates);
  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;

  // Ensure newly added networks are included in the tokenNetworkFilter
  useEffect(() => {
    if (process.env.PORTFOLIO_VIEW) {
      const allNetworkFilters = Object.fromEntries(
        Object.keys(allNetworks).map((chainId) => [chainId, true]),
      );
      if (Object.keys(tokenNetworkFilter || {}).length > 1) {
        dispatch(setTokenNetworkFilter(allNetworkFilters));
      }
    }
  }, [Object.keys(allNetworks).length]);

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

          if (hideZeroBalanceTokens) {
            // only hide zero balance tokens if not native gas token
            if (!token.isNative && balance === '0') {
              return;
            } else {
              tokensWithBalance.push({
                ...token,
                balance,
                tokenFiatAmount,
                chainId,
                string: String(balance),
              });
            }
          } else {
            tokensWithBalance.push({
              ...token,
              balance,
              tokenFiatAmount,
              chainId,
              string: String(balance),
            });
          }
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
    newTokensImported,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  // Displays nativeToken if provided
  if (nativeToken) {
    return React.cloneElement(nativeToken as React.ReactElement);
  }

  // TODO: We can remove this string. However it will result in a huge file 50+ file diff
  // Lets remove it in a separate PR
  if (sortedFilteredTokens === undefined) {
    console.log(t('loadingTokens'));
  }

  // Check if testnet
  const isTestnet = useSelector(getIsTestnet);
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );
  const isMainnet = !isTestnet;
  // Check if show conversion is enabled
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  return (
    <div>
      {sortedFilteredTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.chainId}-${tokenData.symbol}-${tokenData.address}`}
          chainId={tokenData.chainId}
          address={tokenData.address}
          symbol={tokenData.symbol}
          tokenFiatAmount={showFiat ? tokenData.tokenFiatAmount : null}
          image={tokenData?.image}
          isNative={tokenData.isNative}
          string={tokenData.string}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
