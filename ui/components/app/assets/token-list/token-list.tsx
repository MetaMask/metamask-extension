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
import { TokenWithBalance } from '../asset-list/asset-list';
import { sortAssets } from '../util/sort';
import {
  getAllTokens,
  getCurrentChainId,
  getPreferences,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../selectors';
import { useAccountTotalFiatBalance } from '../../../../hooks/useAccountTotalFiatBalance';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { useNativeTokenBalance } from '../asset-list/native-token/use-native-token-balance';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';

type TokenListProps = {
  onTokenClick: (arg: string) => void;
  nativeToken: ReactNode;
};

function aggregateTokensByAccount(data: Record<string, any>) {
  // Initialize an empty object to hold tokens by account
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokensByAccount: Record<string, any> = {};

  // Loop through each chain (0x1, 0x89, etc.)
  for (const chainId in data) {
    // Ensure we're only iterating over data's own properties
    if (data[chainId]) {
      // Loop through each account in the chain
      const chainData = data[chainId];
      for (const accountId in chainData) {
        if (chainData[accountId]) {
          // If the accountId does not exist in the tokensByAccount object, initialize it with an empty array
          if (!tokensByAccount[accountId]) {
            tokensByAccount[accountId] = [];
          }

          // Loop through each token associated with the account
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chainData[accountId].forEach((token: any) => {
            // Add the chainId to each token object
            const tokenWithChain = { ...token, chainId };

            // Push the token to the respective account's token list
            tokensByAccount[accountId].push(tokenWithChain);
          });
        }
      }
    }
  }

  return tokensByAccount;
}

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
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );

  const allTokens = useSelector(getAllTokens);
  const aggregatedCrossChainTokensByAccount =
    aggregateTokensByAccount(allTokens);

  console.log(aggregatedCrossChainTokensByAccount[selectedAccount.address]);

  const { tokensWithBalances: crossChainTokensWithBalances } = useTokenTracker({
    tokens: aggregatedCrossChainTokensByAccount[selectedAccount.address],
    address: selectedAccount?.address,
    includeFailedTokens: true,
    hideZeroBalanceTokens: shouldHideZeroBalanceTokens,
  });
  console.log('crossChainTokensWithBalances: ', crossChainTokensWithBalances);

  const { tokensWithBalances, loading } = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  ) as {
    tokensWithBalances: TokenWithBalance[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mergedRates: any;
    loading: boolean;
  };

  const sortedTokens = useMemo(() => {
    // TODO filter assets by networkTokenFilter before sorting
    return sortAssets(
      [nativeTokenWithBalance, ...tokensWithBalances],
      tokenSortConfig,
    );
  }, [
    tokensWithBalances,
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
  ]);

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
        if (tokenData?.isNative) {
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
