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
  getPreferences,
  getSelectedAccount,
  getSelectedAccountTokenBalancesAcrossChains,
  getSelectedAccountTokensAcrossChains,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
  getTokensMarketDataAcrossChains,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { useNativeTokenBalance } from '../asset-list/native-token/use-native-token-balance';
import { filterAssets } from '../util/filter';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken: ReactNode;
};

export default function TokenList({
  onTokenClick,
  nativeToken,
}: TokenListProps) {
  const t = useI18nContext();
  const { tokenSortConfig, tokenNetworkFilter } = useSelector(getPreferences);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const nativeTokenWithBalance = useNativeTokenBalance();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  console.log('native values', {
    nativeTokenWithBalance,
    selectedAccount,
    shouldHideZeroBalanceTokens,
  });
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const selectedAccountTokensChains: Record<string, any> = useSelector(
    getSelectedAccountTokensAcrossChains,
  );

  const selectedAccountTokenBalancesAcrossChains: Record<string, any> =
    useSelector(getSelectedAccountTokenBalancesAcrossChains);

  const marketData = useSelector(getTokensMarketDataAcrossChains);
  const currencyRates = useSelector(getCurrencyRates);

  // Select token data, and token balances
  // Consolidate both data structures into an array of tokens, along with their balances
  // include an isNative boolean to indicate that these are _not_ native tokens
  const consolidatedBalances = () => {
    const tokensWithBalance: any[] = [];

    // Iterate over each chainId in accountTokensByChain
    Object.keys(selectedAccountTokensChains).forEach((chainId: string) => {
      // For each token in the chain, add the balance from tokenBalancesByChain
      selectedAccountTokensChains[chainId].forEach(
        (token: Record<string, any>) => {
          const { address } = token;
          const balance =
            selectedAccountTokenBalancesAcrossChains[chainId]?.[address] ||
            '0.00000'; // Default to "0.00000" if no balance found

          const baseCurrency = marketData[chainId]?.[address]?.currency;

          const tokenMarketPrice = marketData[chainId]?.[address]?.price || '0';
          const tokenExchangeRate =
            currencyRates[baseCurrency]?.conversionRate || '0';

          // Add the token with its balance to the result array
          tokensWithBalance.push({
            ...token,
            balance,
            tokenFiatAmount: tokenMarketPrice * tokenExchangeRate * balance,
            isNative: false,
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
    const filteredSortedAssets = sortAssets(filteredAssets, tokenSortConfig);
    return filteredSortedAssets;
  }, [
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
  ]);

  const loading = false; // TODO should we include loading/polling logic?
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
      {sortedTokens.map((tokenData) => {
        console.log('here', { tokenData });
        if (tokenData?.isNative) {
          console.log('is native:', { tokenData });
          // we need cloneElement so that we can pass the unique key
          return React.cloneElement(nativeToken as React.ReactElement, {
            key: `${tokenData.symbol}-${tokenData.address}`,
          });
        }
        return (
          <TokenCell
            key={`${tokenData.symbol}-${tokenData.address}`}
            {...tokenData}
            onClick={onTokenClick}
          />
        );
      })}
    </div>
  );
}
